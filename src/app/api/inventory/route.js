import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');

    const db = await readDB();
    let list = db.inventory || [];

    if (category) {
      list = list.filter(i => i.category === category);
    }
    if (condition) {
      list = list.filter(i => i.condition === condition);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => 
        (i.name && i.name.toLowerCase().includes(q)) || 
        (i.code && i.code.toLowerCase().includes(q)) ||
        (i.location && i.location.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const db = await readDB();
    const inventory = db.inventory || [];

    const newId = generateId('INV-', inventory);
    const num = parseInt(newId.slice(4), 10);
    const code = body.code || `BRG-${String(num).padStart(2, '0')}`;

    const newItem = {
      id: newId,
      code: code,
      name: body.name,
      category: body.category || 'Perlengkapan',
      quantity: Number(body.quantity) || 1,
      unit: body.unit || 'Buah',
      condition: body.condition || 'Baik',
      location: body.location || 'Sekretariat',
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };

    inventory.push(newItem);
    db.inventory = inventory;
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: newItem, message: 'Barang inventaris berhasil dicatat' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
