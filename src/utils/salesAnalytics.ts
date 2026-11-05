import Papa from 'papaparse';
import { SalesOrder, RegionSummary, VarianceAnalysis, MetricDriver, DataCleaningAudit, CleaningRecord } from '../types';

/**
 * Text Cleaner for Region
 * Fixes casing (e.g. "west" -> "West"), extra spaces, punctuation, multi-word regions.
 */
export function cleanRegion(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Unknown', wasModified: false };
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').replace(/[.,;]+$/, '');
  const collapsed = trimmed.replace(/\s+/g, ' ');

  // Standard regional dictionary
  const standardRegions: Record<string, string> = {
    west: 'West',
    east: 'East',
    north: 'North',
    south: 'South',
    midwest: 'Midwest',
    'mid-west': 'Midwest',
    'mid west': 'Midwest',
    northeast: 'Northeast',
    northwest: 'Northwest',
    southeast: 'Southeast',
    southwest: 'Southwest',
    central: 'Central',
    'pacific northwest': 'Pacific Northwest',
  };

  const lower = collapsed.toLowerCase();
  let cleaned = '';
  let reason = '';

  if (standardRegions[lower]) {
    cleaned = standardRegions[lower];
    if (raw !== cleaned) {
      if (raw.toLowerCase() === cleaned.toLowerCase() && raw !== cleaned) {
        reason = `Normalized casing from "${raw}" to standard "${cleaned}"`;
      } else {
        reason = `Standardized region name from "${raw}" to "${cleaned}"`;
      }
    }
  } else {
    // Multi-word title case for custom regions (e.g., "Latin America", "Western Europe")
    cleaned = collapsed
      .split(/([\s\-_]+)/)
      .map(part => {
        if (/^[\s\-_]+$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
    if (raw !== cleaned) {
      reason = `Cleaned whitespace and applied title casing to "${raw}"`;
    }
  }

  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? reason : undefined,
  };
}

/**
 * Text Cleaner for Quarter
 * Fixes "q1", "q 1", "quarter 1", "2026-q1", "qtr1", etc.
 */
export function cleanQuarter(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Q1', wasModified: false };
  const trimmed = raw.trim().toUpperCase().replace(/^["']|["']$/g, '');

  let cleaned = trimmed;
  let reason = '';

  const qMatch = trimmed.match(/(?:QUARTER|QTR|Q|T)?\s*([1-4])/i);
  if (qMatch && qMatch[1]) {
    cleaned = `Q${qMatch[1]}`;
    if (raw !== cleaned) {
      reason = `Standardized quarter format from "${raw}" to "${cleaned}"`;
    }
  }

  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? reason : undefined,
  };
}

/**
 * Text Cleaner for Sales Channel
 * Fixes "online", "ONLINE", "retail", "partner", "e-commerce", etc.
 */
export function cleanChannel(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'General', wasModified: false };
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
  const lower = trimmed.toLowerCase();

  let cleaned = '';
  let reason = '';

  if (['online', 'web', 'internet', 'e-commerce', 'ecommerce'].includes(lower)) {
    cleaned = 'Online';
    if (raw !== cleaned) reason = `Standardized digital channel "${raw}" to "Online"`;
  } else if (['retail', 'store', 'in-store', 'in store', 'shop'].includes(lower)) {
    cleaned = 'Retail';
    if (raw !== cleaned) reason = `Standardized store channel "${raw}" to "Retail"`;
  } else if (['partner', 'partners', 'wholesale', 'b2b', 'reseller'].includes(lower)) {
    cleaned = 'Partner';
    if (raw !== cleaned) reason = `Standardized partner channel "${raw}" to "Partner"`;
  } else {
    cleaned = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (raw !== cleaned) reason = `Applied title casing to channel "${raw}"`;
  }

  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? reason : undefined,
  };
}

/**
 * Text Cleaner for Product Names
 * Fixes casing while preserving standard industry acronyms (e.g. "XL", "Pro", "Mini").
 */
export function cleanProduct(raw: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Product', wasModified: false };
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
  const lower = trimmed.toLowerCase();

  let cleaned = '';
  let reason = '';

  // Known catalog mapping
  const knownProducts: Record<string, string> = {
    'air fryer xl': 'Air Fryer XL',
    'air fryer': 'Air Fryer XL',
    'airfryer xl': 'Air Fryer XL',
    'pro blender': 'Pro Blender',
    'blender': 'Pro Blender',
    'knife set': 'Knife Set',
    'knives': 'Knife Set',
    'espresso mini': 'Espresso Mini',
    'espresso': 'Espresso Mini',
    'smart kettle': 'Smart Kettle',
    'kettle': 'Smart Kettle',
  };

  if (knownProducts[lower]) {
    cleaned = knownProducts[lower];
    if (raw !== cleaned) {
      reason = `Standardized product nomenclature and acronym casing from "${raw}" to "${cleaned}"`;
    }
  } else {
    // Title case with uppercase preservation for acronyms
    const acronyms = new Set(['XL', 'HD', '4K', 'USB', 'LED', 'AI', 'PRO', 'MINI', 'MAX', 'PLUS']);
    cleaned = trimmed
      .split(' ')
      .map(w => {
        const u = w.toUpperCase();
        if (acronyms.has(u)) return u;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');

    if (raw !== cleaned) {
      reason = `Standardized product title casing from "${raw}" to "${cleaned}"`;
    }
  }

  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? reason : undefined,
  };
}

/**
 * Text Cleaner for Customer Type
 */
export function cleanCustomerType(raw?: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Returning', wasModified: false };
  const lower = raw.trim().toLowerCase();
  let cleaned = 'Returning';
  if (['new', 'first-time', 'first time'].includes(lower)) {
    cleaned = 'New';
  } else {
    cleaned = 'Returning';
  }
  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? `Normalized customer type from "${raw}" to "${cleaned}"` : undefined,
  };
}

/**
 * Text Cleaner for Sales Representative
 * Standardizes "m.brooks" or "m. Brooks" -> "M. Brooks"
 */
export function cleanSalesRep(raw?: string): { cleaned: string; wasModified: boolean; reason?: string } {
  if (!raw) return { cleaned: 'Unassigned', wasModified: false };
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');

  // Check for pattern like "M. Brooks" or "m.brooks"
  const match = trimmed.match(/^([a-zA-Z])\.?\s*([a-zA-Z]+.*)$/);
  let cleaned = trimmed;
  let reason = '';

  if (match) {
    const initial = match[1].toUpperCase();
    const lastName = match[2].trim();
    const capLast = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
    cleaned = `${initial}. ${capLast}`;
    if (raw !== cleaned) {
      reason = `Standardized sales rep initial and name format from "${raw}" to "${cleaned}"`;
    }
  } else {
    cleaned = trimmed
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    if (raw !== cleaned) {
      reason = `Title-cased sales rep name from "${raw}" to "${cleaned}"`;
    }
  }

  return {
    cleaned,
    wasModified: raw !== cleaned,
    reason: raw !== cleaned ? reason : undefined,
  };
}

export function parseSalesCSV(csvContent: string): {
  orders: SalesOrder[];
  errors: string[];
  audit: DataCleaningAudit;
} {
  const errors: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach(err => errors.push(`Row ${err.row}: ${err.message}`));
  }

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    return {
      orders: [],
      errors: ['CSV file is empty.'],
      audit: {
        totalCorrectionsCount: 0,
        correctionsByColumn: {},
        records: [],
        rulesApplied: [],
      },
    };
  }

  // Find columns with case-insensitive matching
  const sample = rows[0];
  const keys = Object.keys(sample);

  const findKey = (candidates: string[]): string | undefined => {
    return keys.find(k => {
      const cleanKey = k.toLowerCase().replace(/[\s_-]/g, '');
      return candidates.some(c => cleanKey === c.toLowerCase().replace(/[\s_-]/g, ''));
    });
  };

  const quarterKey = findKey(['quarter', 'qtr', 'q']);
  const regionKey = findKey(['region', 'reg', 'territory', 'area']);
  const channelKey = findKey(['channel', 'saleschannel', 'distributionchannel']);
  const productKey = findKey(['product', 'item', 'productname', 'sku']);
  const unitsKey = findKey(['units', 'unit', 'quantity', 'qty']);
  const discountKey = findKey(['discountpct', 'discount', 'discountpercentage', 'discountpercent']);
  const revenueKey = findKey(['revenue', 'sales', 'salesrevenue', 'totalrevenue', 'amount']);
  const unitPriceKey = findKey(['unitprice', 'price', 'rate']);
  const customerTypeKey = findKey(['customertype', 'customer']);
  const salesRepKey = findKey(['salesrep', 'rep', 'agent']);

  const missingColumns: string[] = [];
  if (!quarterKey) missingColumns.push('quarter');
  if (!regionKey) missingColumns.push('region');
  if (!channelKey) missingColumns.push('channel');
  if (!productKey) missingColumns.push('product');
  if (!unitsKey) missingColumns.push('units');
  if (!discountKey) missingColumns.push('discount_pct');
  if (!revenueKey) missingColumns.push('revenue');

  if (missingColumns.length > 0) {
    errors.push(`Missing required column(s): ${missingColumns.join(', ')}.`);
  }

  const orders: SalesOrder[] = [];
  const auditRecords: CleaningRecord[] = [];
  const correctionsByColumn: Record<string, number> = {
    region: 0,
    quarter: 0,
    channel: 0,
    product: 0,
    customer_type: 0,
    sales_rep: 0,
    unit_price: 0,
  };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for CSV header
    const orderId = row['order_id'] || row['orderId'] || `ORD-${idx + 1}`;

    const rawQuarter = quarterKey ? row[quarterKey] : '';
    const rawRegion = regionKey ? row[regionKey] : '';
    const rawChannel = channelKey ? row[channelKey] : '';
    const rawProduct = productKey ? row[productKey] : '';
    const rawUnits = unitsKey ? row[unitsKey] : '0';
    const rawDiscount = discountKey ? row[discountKey] : '0';
    const rawRevenue = revenueKey ? row[revenueKey] : '0';
    const rawUnitPrice = unitPriceKey ? row[unitPriceKey] : '';
    const rawCustomerType = customerTypeKey ? row[customerTypeKey] : '';
    const rawSalesRep = salesRepKey ? row[salesRepKey] : '';

    if (!rawQuarter || !rawRegion) return; // skip empty line

    // Clean text columns
    const qClean = cleanQuarter(rawQuarter);
    const rClean = cleanRegion(rawRegion);
    const cClean = cleanChannel(rawChannel);
    const pClean = cleanProduct(rawProduct);
    const custClean = cleanCustomerType(rawCustomerType);
    const repClean = cleanSalesRep(rawSalesRep);

    const cleaningNotes: string[] = [];

    // Track Quarter fixes
    if (qClean.wasModified) {
      correctionsByColumn.quarter = (correctionsByColumn.quarter || 0) + 1;
      cleaningNotes.push(`Quarter: "${rawQuarter}" → "${qClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'quarter',
        originalValue: rawQuarter,
        cleanedValue: qClean.cleaned,
        reason: qClean.reason || 'Quarter normalized',
      });
    }

    // Track Region fixes (e.g. "west" -> "West")
    if (rClean.wasModified) {
      correctionsByColumn.region = (correctionsByColumn.region || 0) + 1;
      cleaningNotes.push(`Region: "${rawRegion}" → "${rClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'region',
        originalValue: rawRegion,
        cleanedValue: rClean.cleaned,
        reason: rClean.reason || 'Region casing normalized',
      });
    }

    // Track Channel fixes
    if (cClean.wasModified) {
      correctionsByColumn.channel = (correctionsByColumn.channel || 0) + 1;
      cleaningNotes.push(`Channel: "${rawChannel}" → "${cClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'channel',
        originalValue: rawChannel,
        cleanedValue: cClean.cleaned,
        reason: cClean.reason || 'Channel normalized',
      });
    }

    // Track Product fixes
    if (pClean.wasModified) {
      correctionsByColumn.product = (correctionsByColumn.product || 0) + 1;
      cleaningNotes.push(`Product: "${rawProduct}" → "${pClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'product',
        originalValue: rawProduct,
        cleanedValue: pClean.cleaned,
        reason: pClean.reason || 'Product name/acronym normalized',
      });
    }

    // Track Customer Type fixes
    if (custClean.wasModified) {
      correctionsByColumn.customer_type = (correctionsByColumn.customer_type || 0) + 1;
      cleaningNotes.push(`Customer Type: "${rawCustomerType}" → "${custClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'customer_type',
        originalValue: rawCustomerType,
        cleanedValue: custClean.cleaned,
        reason: custClean.reason || 'Customer type normalized',
      });
    }

    // Track Sales Rep fixes
    if (repClean.wasModified) {
      correctionsByColumn.sales_rep = (correctionsByColumn.sales_rep || 0) + 1;
      cleaningNotes.push(`Sales Rep: "${rawSalesRep}" → "${repClean.cleaned}"`);
      auditRecords.push({
        rowNumber: rowNum,
        orderId,
        column: 'sales_rep',
        originalValue: rawSalesRep,
        cleanedValue: repClean.cleaned,
        reason: repClean.reason || 'Sales rep name normalized',
      });
    }

    // Numbers cleanup
    const units = parseInt(String(rawUnits).replace(/[^0-9.-]/g, ''), 10) || 0;
    const discount_pct = parseFloat(String(rawDiscount).replace(/[^0-9.-]/g, '')) || 0;
    let revenue = parseFloat(String(rawRevenue).replace(/[^0-9.-]/g, '')) || 0;
    let unit_price = rawUnitPrice ? parseFloat(String(rawUnitPrice).replace(/[^0-9.-]/g, '')) : undefined;

    // Handle missing unit_price when revenue and units are present
    if ((unit_price === undefined || isNaN(unit_price) || unit_price === 0) && revenue > 0 && units > 0) {
      const discountFactor = 1 - discount_pct / 100;
      if (discountFactor > 0) {
        unit_price = parseFloat((revenue / (units * discountFactor)).toFixed(2));
        correctionsByColumn.unit_price = (correctionsByColumn.unit_price || 0) + 1;
        cleaningNotes.push(`Backfilled missing unit price: $${unit_price.toFixed(2)}`);
        auditRecords.push({
          rowNumber: rowNum,
          orderId,
          column: 'unit_price',
          originalValue: '(empty)',
          cleanedValue: `$${unit_price.toFixed(2)}`,
          reason: 'Calculated unit price from revenue, units, and discount rate',
        });
      }
    }

    orders.push({
      order_id: orderId,
      order_date: row['order_date'] || row['orderDate'],
      quarter: qClean.cleaned,
      region: rClean.cleaned,
      channel: cClean.cleaned,
      product: pClean.cleaned,
      customer_type: custClean.cleaned,
      sales_rep: repClean.cleaned,
      units,
      unit_price,
      discount_pct,
      revenue,
      wasCleaned: cleaningNotes.length > 0,
      cleaningNotes,
    });
  });

  const rulesApplied = [
    'Case Inconsistency Resolution: Standardized lowercase/uppercase regions (e.g. "west" → "West")',
    'Whitespace Sanitization: Stripped leading, trailing, and duplicate whitespace across all text columns',
    'Catalog Nomenclature: Preserved trademark acronyms (e.g. "XL") and unified product names',
    'Distribution Channel Standard: Cleaned channel variations to canonical "Online", "Retail", "Partner"',
    'Temporal Normalization: Standardized quarter values into canonical Q1, Q2, Q3, Q4 format',
    'Representative Formatting: Standardized sales rep names and initial spacing',
  ];

  const totalCorrectionsCount = auditRecords.length;

  return {
    orders,
    errors,
    audit: {
      totalCorrectionsCount,
      correctionsByColumn,
      records: auditRecords,
      rulesApplied,
    },
  };
}

export function calculateRegionalAggregates(orders: SalesOrder[]): {
  regions: RegionSummary[];
  quarters: string[];
  grandTotalRevenue: number;
  grandTotalUnits: number;
} {
  const quartersSet = new Set<string>();
  const regionMap = new Map<string, {
    qRevenues: Record<string, number>;
    qUnits: Record<string, number>;
  }>();

  let grandTotalRevenue = 0;
  let grandTotalUnits = 0;

  for (const order of orders) {
    quartersSet.add(order.quarter);
    grandTotalRevenue += order.revenue;
    grandTotalUnits += order.units;

    if (!regionMap.has(order.region)) {
      regionMap.set(order.region, { qRevenues: {}, qUnits: {} });
    }
    const regData = regionMap.get(order.region)!;
    regData.qRevenues[order.quarter] = (regData.qRevenues[order.quarter] || 0) + order.revenue;
    regData.qUnits[order.quarter] = (regData.qUnits[order.quarter] || 0) + order.units;
  }

  // Sort quarters logically: Q1, Q2, Q3, Q4, then any others
  const sortedQuarters = Array.from(quartersSet).sort((a, b) => {
    const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    if (qOrder[a] && qOrder[b]) return qOrder[a] - qOrder[b];
    return a.localeCompare(b);
  });

  const regions: RegionSummary[] = [];

  regionMap.forEach((data, region) => {
    const q1 = data.qRevenues['Q1'] || 0;
    const q2 = data.qRevenues['Q2'] || 0;
    const q3 = data.qRevenues['Q3'] || 0;

    const u1 = data.qUnits['Q1'] || 0;
    const u2 = data.qUnits['Q2'] || 0;
    const u3 = data.qUnits['Q3'] || 0;

    let totalRevenue = 0;
    let totalUnits = 0;
    Object.values(data.qRevenues).forEach(v => (totalRevenue += v));
    Object.values(data.qUnits).forEach(v => (totalUnits += v));

    const q2ToQ3Diff = q3 - q2;
    const q2ToQ3PctChange = q2 !== 0 ? (q2ToQ3Diff / q2) * 100 : 0;

    regions.push({
      region,
      q1Revenue: q1,
      q2Revenue: q2,
      q3Revenue: q3,
      totalRevenue,
      q2ToQ3Diff,
      q2ToQ3PctChange,
      q1Units: u1,
      q2Units: u2,
      q3Units: u3,
      totalUnits,
    });
  });

  // Sort regions alphabetically or by total revenue descending
  regions.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    regions,
    quarters: sortedQuarters,
    grandTotalRevenue,
    grandTotalUnits,
  };
}

export function computeVarianceAnalysis(orders: SalesOrder[], regionalSummaries: RegionSummary[]): VarianceAnalysis | null {
  if (!regionalSummaries.length) return null;

  // Region that changed most from Q2 to Q3 in absolute dollar terms
  let mostChanged = regionalSummaries[0];
  let maxAbsDiff = Math.abs(mostChanged.q2ToQ3Diff);

  for (const reg of regionalSummaries) {
    const absDiff = Math.abs(reg.q2ToQ3Diff);
    if (absDiff > maxAbsDiff) {
      maxAbsDiff = absDiff;
      mostChanged = reg;
    }
  }

  const targetRegion = mostChanged.region;
  const q2Rev = mostChanged.q2Revenue;
  const q3Rev = mostChanged.q3Revenue;
  const netDiff = mostChanged.q2ToQ3Diff;
  const pctChange = mostChanged.q2ToQ3PctChange;

  // Filter orders for target region in Q2 and Q3
  const targetOrders = orders.filter(
    o => o.region.toLowerCase() === targetRegion.toLowerCase() && (o.quarter === 'Q2' || o.quarter === 'Q3')
  );

  // Group by product
  const productMap = new Map<string, { q2Rev: number; q3Rev: number }>();
  // Group by channel
  const channelMap = new Map<string, { q2Rev: number; q3Rev: number }>();

  let q2Units = 0;
  let q3Units = 0;
  let q2DiscountSum = 0;
  let q3DiscountSum = 0;
  let q2Count = 0;
  let q3Count = 0;

  for (const ord of targetOrders) {
    if (ord.quarter === 'Q2') {
      q2Units += ord.units;
      q2DiscountSum += ord.discount_pct;
      q2Count++;

      const pData = productMap.get(ord.product) || { q2Rev: 0, q3Rev: 0 };
      pData.q2Rev += ord.revenue;
      productMap.set(ord.product, pData);

      const cData = channelMap.get(ord.channel) || { q2Rev: 0, q3Rev: 0 };
      cData.q2Rev += ord.revenue;
      channelMap.set(ord.channel, cData);
    } else if (ord.quarter === 'Q3') {
      q3Units += ord.units;
      q3DiscountSum += ord.discount_pct;
      q3Count++;

      const pData = productMap.get(ord.product) || { q2Rev: 0, q3Rev: 0 };
      pData.q3Rev += ord.revenue;
      productMap.set(ord.product, pData);

      const cData = channelMap.get(ord.channel) || { q2Rev: 0, q3Rev: 0 };
      cData.q3Rev += ord.revenue;
      channelMap.set(ord.channel, cData);
    }
  }

  const q2AvgDiscountPct = q2Count > 0 ? q2DiscountSum / q2Count : 0;
  const q3AvgDiscountPct = q3Count > 0 ? q3DiscountSum / q3Count : 0;
  const discountDiffPctPoints = q3AvgDiscountPct - q2AvgDiscountPct;

  const unitsDiff = q3Units - q2Units;
  const unitsPctChange = q2Units > 0 ? (unitsDiff / q2Units) * 100 : 0;

  const productDrivers: MetricDriver[] = [];
  productMap.forEach((vals, name) => {
    const diff = vals.q3Rev - vals.q2Rev;
    const pct = vals.q2Rev > 0 ? (diff / vals.q2Rev) * 100 : 0;
    productDrivers.push({
      name,
      q2Revenue: vals.q2Rev,
      q3Revenue: vals.q3Rev,
      diff,
      pctChange: pct,
    });
  });
  // Sort product drivers by magnitude of change descending
  productDrivers.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const channelDrivers: MetricDriver[] = [];
  channelMap.forEach((vals, name) => {
    const diff = vals.q3Rev - vals.q2Rev;
    const pct = vals.q2Rev > 0 ? (diff / vals.q2Rev) * 100 : 0;
    channelDrivers.push({
      name,
      q2Revenue: vals.q2Rev,
      q3Revenue: vals.q3Rev,
      diff,
      pctChange: pct,
    });
  });
  channelDrivers.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return {
    mostChangedRegion: targetRegion,
    changeType: netDiff < 0 ? 'decrease' : 'increase',
    q2Revenue: q2Rev,
    q3Revenue: q3Rev,
    diff: netDiff,
    absDiff: maxAbsDiff,
    pctChange,
    q2Units,
    q3Units,
    unitsDiff,
    unitsPctChange,
    q2AvgDiscountPct,
    q3AvgDiscountPct,
    discountDiffPctPoints,
    productDrivers,
    channelDrivers,
    allRegions: regionalSummaries.map(r => ({
      region: r.region,
      q1Revenue: r.q1Revenue,
      q2Revenue: r.q2Revenue,
      q3Revenue: r.q3Revenue,
      totalRevenue: r.totalRevenue,
      diff: r.q2ToQ3Diff,
      pctChange: r.q2ToQ3PctChange,
    })),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return formatCurrency(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
