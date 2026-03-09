import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResumen } from '../database';

const C = {
  bg: '#0a0a0a',
  surface: '#141414',
  surface2: '#1c1c1c',
  border: '#2c2c2c',
  red: '#e8003a',
  gold: '#c9a84c',
  green: '#2ecc71',
  text: '#f0f0f0',
  muted: '#666',
};

function getMeses() {
  const meses = [];
  const hoy = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });

    meses.push({ val, label });
  }

  return meses;
}

export default function DashboardScreen() {
  const meses = useMemo(() => getMeses(), []);
  const [mesIdx, setMesIdx] = useState(0);
  const [resumen, setResumen] = useState(null);

  const mes = meses[mesIdx] || meses[0];

  useFocusEffect(
    useCallback(() => {
      try {
        if (!mes?.val) return;

        console.log('Dashboard -> mes enviado a getResumen:', mes.val);

        const r = getResumen(mes.val);
        setResumen(r);
      } catch (error) {
        console.error('Error cargando resumen:', error);
      }
    }, [mes])
  );

  return (
    <View style={s.container}>
      <View style={s.mesRow}>
        <TouchableOpacity
          onPress={() => setMesIdx((i) => Math.min(i + 1, meses.length - 1))}
          style={s.mesBtn}
        >
          <Text style={s.mesBtnTxt}>‹</Text>
        </TouchableOpacity>

        <Text style={s.mesLabel}>{mes?.label?.toUpperCase() || 'CARGANDO...'}</Text>

        <TouchableOpacity
          onPress={() => setMesIdx((i) => Math.max(i - 1, 0))}
          style={s.mesBtn}
        >
          <Text style={s.mesBtnTxt}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {resumen && (
          <>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { borderBottomColor: C.green }]}>
                <Text style={s.statLabel}>INGRESOS</Text>
                <Text style={[s.statValue, { color: C.green }]}>
                  {Number(resumen.totalIngresos || 0).toFixed(2)} €
                </Text>
              </View>

              <View style={[s.statCard, { borderBottomColor: C.red }]}>
                <Text style={s.statLabel}>GASTOS</Text>
                <Text style={[s.statValue, { color: C.red }]}>
                  {Number(resumen.totalGastos || 0).toFixed(2)} €
                </Text>
              </View>

              <View style={[s.statCard, s.statFull, { borderBottomColor: C.gold }]}>
                <Text style={s.statLabel}>BENEFICIO NETO</Text>
                <Text
                  style={[
                    s.statValue,
                    {
                      color: resumen.beneficio >= 0 ? C.green : C.red,
                      fontSize: 32,
                    },
                  ]}
                >
                  {resumen.beneficio >= 0 ? '+' : '-'}
                  {Math.abs(Number(resumen.beneficio || 0)).toFixed(2)} €
                </Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>EVOLUCIÓN — ÚLTIMOS 6 MESES</Text>
              <View style={s.chartWrap}>
                {Array.isArray(resumen.tendencia) &&
                  resumen.tendencia.map((t, i) => {
                    const maxVal = Math.max(
                      ...resumen.tendencia.map((x) =>
                        Math.max(Number(x.ingresos || 0), Number(x.gastos || 0))
                      ),
                      1
                    );

                    return (
                      <View key={i} style={s.barGroup}>
                        <View style={s.bars}>
                          <View
                            style={[
                              s.bar,
                              {
                                height: (Number(t.ingresos || 0) / maxVal) * 100,
                                backgroundColor: C.green,
                              },
                            ]}
                          />
                          <View
                            style={[
                              s.bar,
                              {
                                height: (Number(t.gastos || 0) / maxVal) * 100,
                                backgroundColor: C.red,
                              },
                            ]}
                          />
                        </View>
                        <Text style={s.barLabel}>{t.mes}</Text>
                      </View>
                    );
                  })}
              </View>

              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: C.green }]} />
                  <Text style={s.legendTxt}>Ingresos</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: C.red }]} />
                  <Text style={s.legendTxt}>Gastos</Text>
                </View>
              </View>
            </View>

            {Array.isArray(resumen.porProveedor) && resumen.porProveedor.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>GASTOS POR PROVEEDOR</Text>

                {resumen.porProveedor.map((p, i) => {
                  const maxVal = Number(resumen.porProveedor[0]?.total || 1);

                  return (
                    <View key={i} style={s.provRow}>
                      <Text style={s.provName}>{p.nombre}</Text>
                      <View style={s.provBarWrap}>
                        <View
                          style={[
                            s.provBar,
                            {
                              width: `${(Number(p.total || 0) / maxVal) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={s.provAmt}>{Number(p.total || 0).toFixed(0)} €</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#080808',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  mesBtn: { padding: 8 },
  mesBtnTxt: { color: C.text, fontSize: 24, lineHeight: 24 },
  mesLabel: { color: C.muted, fontSize: 11, letterSpacing: 2 },
  scroll: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 16,
    borderBottomWidth: 3,
  },
  statFull: { width: '100%', flex: 0 },
  statLabel: { color: C.muted, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '300' },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { color: C.muted, fontSize: 9, letterSpacing: 2, marginBottom: 16 },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    marginBottom: 12,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100 },
  bar: { width: 10, borderRadius: 3, minHeight: 2 },
  barLabel: { color: C.muted, fontSize: 8, marginTop: 6, letterSpacing: 0.5 },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { color: C.muted, fontSize: 10 },
  provRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  provName: { color: C.text, fontSize: 11, width: 90 },
  provBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: C.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  provBar: { height: '100%', backgroundColor: C.red, borderRadius: 3 },
  provAmt: { color: C.red, fontSize: 11, width: 50, textAlign: 'right' },
});