import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteIngreso, getIngresos, saveIngreso } from '../database';

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
  const ahora = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({
      val: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    });
  }

  return meses;
}

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fechaBonita(fecha) {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

export default function IngresosScreen() {
  const meses = useMemo(() => getMeses(), []);
  const [mesIdx, setMesIdx] = useState(0);
  const [ingresos, setIngresos] = useState([]);
  const [modal, setModal] = useState(false);
  const [fecha, setFecha] = useState(hoy());
  const [total, setTotal] = useState('');
  const [notas, setNotas] = useState('');

  const mes = meses[mesIdx] || meses[0];
  const fechaHoy = hoy();

  const cargar = useCallback(() => {
    try {
      if (!mes?.val) return;
      setIngresos(getIngresos(mes.val));
    } catch (error) {
      console.error('Error cargando ingresos:', error);
      Alert.alert('Error', 'No se pudieron cargar los ingresos');
    }
  }, [mes]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const ingresoHoy = ingresos.find((i) => i.fecha === fechaHoy) || null;
  const totalMes = ingresos.reduce((s, i) => s + Number(i.total || 0), 0);

  function abrirCajaHoy() {
    setFecha(fechaHoy);
    setTotal(ingresoHoy ? String(ingresoHoy.total) : '');
    setNotas(ingresoHoy?.notas || '');
    setModal(true);
  }

  function abrirEditar(i) {
    setFecha(i.fecha);
    setTotal(String(i.total ?? ''));
    setNotas(i.notas || '');
    setModal(true);
  }

  function guardar() {
    if (!total) {
      Alert.alert('Error', 'Introduce la caja del día');
      return;
    }

    const cantidad = Number(String(total).replace(',', '.'));

    if (Number.isNaN(cantidad) || cantidad < 0) {
      Alert.alert('Error', 'Introduce un importe válido');
      return;
    }

    try {
      saveIngreso(fecha, cantidad, notas || null);
      setModal(false);
      cargar();
    } catch (error) {
      console.error('Error guardando ingreso:', error);
      Alert.alert('Error', 'No se pudo guardar el ingreso');
    }
  }

  function eliminar(id) {
    Alert.alert('Eliminar', '¿Eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            deleteIngreso(id);
            cargar();
          } catch (error) {
            console.error('Error eliminando ingreso:', error);
            Alert.alert('Error', 'No se pudo eliminar el ingreso');
          }
        },
      },
    ]);
  }

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

      <View style={s.cajaHoyCard}>
        <View style={s.cajaHoyTop}>
          <View>
            <Text style={s.cajaHoyMini}>CAJA DIARIA</Text>
            <Text style={s.cajaHoyFecha}>{fechaBonita(fechaHoy)}</Text>
          </View>

          <View>
            <Text style={s.cajaHoyMini}>HOY</Text>
            <Text style={s.cajaHoyTotal}>
              {ingresoHoy ? `${Number(ingresoHoy.total || 0).toFixed(2)} €` : 'Sin apuntar'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={s.cajaHoyBtn} onPress={abrirCajaHoy}>
          <Text style={s.cajaHoyBtnTxt}>
            {ingresoHoy ? 'Editar caja de hoy' : 'Añadir caja de hoy'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.totalBar}>
        <Text style={s.totalLabel}>TOTAL DEL MES</Text>
        <Text style={s.totalValue}>{totalMes.toFixed(2)} €</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {ingresos.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTxt}>Sin ingresos este mes</Text>
          </View>
        ) : (
          ingresos.map((i) => (
            <View key={i.id} style={s.item}>
              <View style={s.itemLeft}>
                <Text style={s.itemFecha}>{i.fecha}</Text>
                {i.notas ? <Text style={s.itemSub}>{i.notas}</Text> : null}
              </View>

              <Text style={s.itemAmt}>{Number(i.total || 0).toFixed(2)} €</Text>

              <TouchableOpacity onPress={() => abrirEditar(i)} style={s.iconBtn}>
                <Text style={s.iconBtnTxt}>✎</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => eliminar(i.id)}
                style={[s.iconBtn, s.iconBtnDanger]}
              >
                <Text style={[s.iconBtnTxt, { color: C.red }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>
              Caja de <Text style={{ color: C.green, fontStyle: 'italic' }}>hoy</Text>
            </Text>

            <Text style={s.fieldLabel}>FECHA</Text>
            <View style={s.inputDisabled}>
              <Text style={s.inputDisabledTxt}>{fecha}</Text>
            </View>

            <Text style={s.fieldLabel}>TOTAL (€)</Text>
            <TextInput
              style={s.input}
              value={total}
              onChangeText={setTotal}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={C.muted}
            />

            <Text style={s.fieldLabel}>NOTAS (opcional)</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={notas}
              onChangeText={setNotas}
              multiline
              placeholder="Evento, festivo, partido..."
              placeholderTextColor={C.muted}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.btnCancel]}
                onPress={() => setModal(false)}
              >
                <Text style={s.btnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.modalBtn, s.btnGreen]} onPress={guardar}>
                <Text style={s.btnTxt}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  cajaHoyCard: {
    backgroundColor: C.surface,
    margin: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
  },
  cajaHoyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cajaHoyMini: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  cajaHoyFecha: {
    color: C.text,
    fontSize: 18,
    fontWeight: '500',
  },
  cajaHoyTotal: {
    color: C.green,
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'right',
  },
  cajaHoyBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  cajaHoyBtnTxt: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  totalBar: {
    backgroundColor: C.surface,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: C.border,
    borderBottomColor: C.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: C.muted, fontSize: 9, letterSpacing: 2 },
  totalValue: { color: C.green, fontSize: 24, fontWeight: '300' },

  scroll: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTxt: { color: C.muted, fontSize: 12, letterSpacing: 1 },

  item: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemLeft: { flex: 1 },
  itemFecha: { color: C.text, fontSize: 14 },
  itemSub: { color: C.muted, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  itemAmt: { color: C.green, fontSize: 18, fontWeight: '300' },

  iconBtn: {
    width: 32,
    height: 32,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: '#3a1a1a' },
  iconBtnTxt: { color: C.muted, fontSize: 16 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: C.text,
    marginBottom: 20,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    color: C.text,
    fontSize: 15,
  },
  inputDisabled: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
  },
  inputDisabledTxt: {
    color: C.text,
    fontSize: 15,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel: { borderWidth: 1, borderColor: C.border },
  btnCancelTxt: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btnGreen: { backgroundColor: C.green },
  btnTxt: {
    color: '#000',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});