import {regtype} from 'pg-meta/pg_catalog'

// generate regtypes from the regtype list of tuples with default names
export const regtypes = new Map<number, string>()
regtype.forEach(([id, name]) => {
  // "timestamptz is accepted as an abbreviation for timestamp with time zone; this is a PostgreSQL extension"
  const nickname = name.replace(/timestamp with time zone/, 'timestamptz')
  regtypes.set(id, nickname)
})

export const type_groups = {
  // DATE
  date: new Set([1082]),
  // TIME
  time: new Set([1083]),
  // TIMESTAMP, TIMESTAMPTZ
  timestamp: new Set([1114, 1184]),
  // FLOAT4, FLOAT8, MONEY, NUMERIC
  numeric: new Set([700, 701, 790, 1700]),
}
