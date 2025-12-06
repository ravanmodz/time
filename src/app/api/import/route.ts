import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'shops';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Get file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
        }

        let updated = 0;
        let inserted = 0;
        let skipped = 0;
        const errors: string[] = [];

        if (type === 'shops') {
            for (let i = 0; i < (data as any[]).length; i++) {
                const row = (data as any[])[i];
                try {
                    const shopData: any = {};

                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase().trim();
                        const value = row[key];

                        // Map common column names
                        if (lowerKey.includes('shop') && (lowerKey.includes('no') || lowerKey.includes('number'))) {
                            shopData.shopNumber = String(value);
                        }
                        else if (lowerKey === 'name' || (lowerKey.includes('shop') && lowerKey.includes('name'))) shopData.name = value;
                        else if (lowerKey.includes('floor') && lowerKey.includes('id')) shopData.floorId = value;
                        else if (lowerKey === 'floor') shopData.floor = value;
                        else if (lowerKey.includes('owner') || lowerKey.includes('tenant')) shopData.ownerName = value;
                        else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('contact')) shopData.phone = String(value);
                        else if (lowerKey.includes('rent')) shopData.rentCharge = Number(value) || 0;
                        else if (lowerKey.includes('water')) shopData.waterCharge = Number(value) || 0;
                        else if (lowerKey.includes('electric')) shopData.electricityCharge = Number(value) || 0;
                        else if (lowerKey.includes('service') || lowerKey.includes('maintenance')) shopData.serviceCharge = Number(value) || 0;
                        else if (lowerKey.includes('area') || lowerKey.includes('size')) shopData.area = value;
                        else if (lowerKey.includes('building')) shopData.buildingName = value;
                        else if (lowerKey.includes('status')) shopData.status = value;
                        else if (lowerKey.includes('balance') || lowerKey.includes('due')) shopData.balance = Number(value) || 0;
                        else {
                            shopData[lowerKey.replace(/ /g, '_')] = value;
                        }
                    });

                    // Skip if no identifier
                    if (!shopData.shopNumber && !shopData.name) {
                        skipped++;
                        continue;
                    }

                    // Build query for update
                    let query: any = {};

                    if (shopData.shopNumber) {
                        query.shopNumber = shopData.shopNumber;
                    } else if (shopData.name) {
                        query.name = shopData.name;
                    }

                    // Use updateOne with $set to update or insert
                    const result = await db.collection('shops').updateOne(
                        query,
                        {
                            $set: {
                                ...shopData,
                                updatedAt: new Date()
                            },
                            $setOnInsert: {
                                createdAt: new Date()
                            }
                        },
                        { upsert: true }
                    );

                    if (result.upsertedCount > 0) inserted++;
                    else if (result.modifiedCount > 0) updated++;
                    else updated++; // matched but not modified (same data)

                } catch (err: any) {
                    errors.push(`Row ${i + 2}: ${err.message}`);
                    skipped++;
                }
            }
        } else if (type === 'bills') {
            // Get last bill number for auto-generation
            const lastBill = await db.collection('bills').findOne({}, { sort: { createdAt: -1 } });
            let billCount = lastBill?.billNumber ? parseInt(lastBill.billNumber.replace('BILL-', '')) : 0;

            for (let i = 0; i < (data as any[]).length; i++) {
                const row = (data as any[])[i];
                try {
                    const billData: any = {};

                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase().trim();
                        const value = row[key];

                        // Shop number detection - check various column name formats
                        if (lowerKey.includes('shop') && (lowerKey.includes('no') || lowerKey.includes('number') || lowerKey === 'shop')) {
                            billData.shopNumber = String(value).trim();
                        }
                        else if (lowerKey.includes('bill') && (lowerKey.includes('no') || lowerKey.includes('number'))) {
                            billData.billNumber = String(value);
                        }
                        else if (lowerKey.includes('month')) billData.billMonth = value;
                        else if (lowerKey.includes('year')) billData.billYear = Number(value) || new Date().getFullYear();
                        else if (lowerKey.includes('rent')) billData.rentAmount = Number(value) || 0;
                        else if (lowerKey.includes('maintenance') || lowerKey.includes('service')) billData.maintenanceCharge = Number(value) || 0;
                        else if (lowerKey.includes('electric')) billData.electricityCharge = Number(value) || 0;
                        else if (lowerKey.includes('water')) billData.waterCharge = Number(value) || 0;
                        else if (lowerKey.includes('other')) billData.otherCharges = Number(value) || 0;
                        else if (lowerKey.includes('discount')) billData.discount = Number(value) || 0;
                        else if (lowerKey.includes('total')) billData.totalAmount = Number(value) || 0;
                        else if (lowerKey.includes('paid')) billData.paidAmount = Number(value) || 0;
                        else if (lowerKey.includes('balance') || lowerKey.includes('due')) billData.balanceAmount = Number(value) || 0;
                        else if (lowerKey.includes('status')) billData.status = value;
                        else {
                            billData[lowerKey.replace(/ /g, '_')] = value;
                        }
                    });

                    // Shop number is required to link bill
                    if (!billData.shopNumber) {
                        errors.push(`Row ${i + 2}: Shop number missing`);
                        skipped++;
                        continue;
                    }

                    // Find shop by shop number
                    const shop = await db.collection('shops').findOne({
                        shopNumber: { $regex: new RegExp(`^${billData.shopNumber}$`, 'i') }
                    });

                    if (!shop) {
                        errors.push(`Row ${i + 2}: Shop '${billData.shopNumber}' not found`);
                        skipped++;
                        continue;
                    }

                    // Find user linked to this shop
                    const user = await db.collection('users').findOne({
                        shopId: shop._id,
                        isActive: true
                    });

                    // Fetch settings for GST and Commission
                    const settings = await db.collection('settings').findOne({ key: 'main' });
                    const gstRate = settings?.gstRate ?? 18;
                    const commissionType = settings?.commissionType || 'percentage';
                    const commissionValue = settings?.commissionValue ?? 0;

                    // Generate bill number if not provided
                    if (!billData.billNumber) {
                        billCount++;
                        billData.billNumber = `BILL-${String(billCount).padStart(6, '0')}`;
                    }

                    // Calculate base amount from Excel
                    const baseAmount = (
                        (billData.rentAmount || 0) +
                        (billData.maintenanceCharge || 0) +
                        (billData.electricityCharge || 0) +
                        (billData.waterCharge || 0) +
                        (billData.otherCharges || 0) -
                        (billData.discount || 0)
                    );

                    // Calculate GST
                    const gstAmount = baseAmount * (gstRate / 100);
                    const cgst = gstAmount / 2;
                    const sgst = gstAmount / 2;

                    // Calculate Commission
                    let commission = 0;
                    if (commissionValue > 0) {
                        if (commissionType === 'percentage') {
                            commission = baseAmount * (commissionValue / 100);
                        } else {
                            commission = commissionValue;
                        }
                    }

                    // Store GST and Commission in bill
                    billData.gstRate = gstRate;
                    billData.gstAmount = gstAmount;
                    billData.cgst = cgst;
                    billData.sgst = sgst;
                    billData.commissionType = commissionType;
                    billData.commissionValue = commissionValue;
                    billData.commissionAmount = commission;

                    // Calculate final total = base + GST + Commission
                    if (!billData.totalAmount) {
                        billData.totalAmount = baseAmount + gstAmount + commission;
                    }

                    // Set balance if not provided
                    if (billData.balanceAmount === undefined) {
                        billData.balanceAmount = billData.totalAmount - (billData.paidAmount || 0);
                    }

                    // Set default values
                    if (!billData.billMonth) billData.billMonth = new Date().toLocaleString('en-US', { month: 'long' });
                    if (!billData.billYear) billData.billYear = new Date().getFullYear();
                    if (!billData.status) {
                        if ((billData.paidAmount || 0) >= billData.totalAmount) billData.status = 'paid';
                        else if ((billData.paidAmount || 0) > 0) billData.status = 'partial';
                        else billData.status = 'pending';
                    }

                    // Remove shopNumber from data (we'll use shopId)
                    delete billData.shopNumber;

                    // Create/update bill with proper linking
                    const result = await db.collection('bills').updateOne(
                        { billNumber: billData.billNumber },
                        {
                            $set: {
                                ...billData,
                                shopId: shop._id,
                                userId: user?._id || null,
                                buildingId: shop.buildingId || null,
                                updatedAt: new Date()
                            },
                            $setOnInsert: {
                                createdAt: new Date(),
                                billDate: new Date(),
                                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
                            }
                        },
                        { upsert: true }
                    );
                    if (result.upsertedCount > 0) inserted++;
                    else updated++;
                } catch (err: any) {
                    errors.push(`Row ${i + 2}: ${err.message}`);
                    skipped++;
                }
            }
        } else if (type === 'payments') {
            for (let i = 0; i < (data as any[]).length; i++) {
                const row = (data as any[])[i];
                try {
                    const paymentData: any = {};

                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase().trim();
                        const value = row[key];

                        if (lowerKey.includes('amount')) paymentData.amount = Number(value) || 0;
                        else if (lowerKey.includes('method') || lowerKey.includes('mode')) paymentData.paymentMethod = value;
                        else if (lowerKey.includes('transaction') || lowerKey.includes('txn')) paymentData.transactionId = String(value);
                        else if (lowerKey.includes('date')) paymentData.paymentDate = value;
                        else if (lowerKey.includes('shop')) paymentData.shopNumber = String(value);
                        else {
                            paymentData[lowerKey.replace(/ /g, '_')] = value;
                        }
                    });

                    await db.collection('payments').insertOne({ ...paymentData, createdAt: new Date() });
                    inserted++;
                } catch (err: any) {
                    errors.push(`Row ${i + 2}: ${err.message}`);
                    skipped++;
                }
            }
        }

        let message = `Import complete! Updated: ${updated}, New: ${inserted}`;
        if (skipped > 0) message += `, Skipped: ${skipped}`;

        return NextResponse.json({
            success: true,
            message,
            updated,
            inserted,
            skipped,
            total: updated + inserted,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined
        });
    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
    }
}
