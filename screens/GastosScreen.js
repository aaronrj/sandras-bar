import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getGastos, addGasto, updateGasto, deleteGasto, getProveedores } from '../database';

const C = {
  bg: '#0a0a0a', surface: '#141414', surface2: '#1c1c1c',
  border: '#2c2c2c', red: '#e8003a', gold: '#c9a84c',
  green: '#2ecc71', text: '#f0f0f0', muted: '#666',
};

function getMeses() {
  const meses = [];
  const hoy = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
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

export default function GastosScreen() {
  const meses = getMeses();
  const [mesIdx, setMesIdx] = useState(0);
  const [gastos, setGastos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [fecha, setFecha] = useState(hoy());
  const [cantidad, setCantidad] = useState('');
  const [concepto, setConcepto] = useState('');
  const [proveedorId, setProveedorId] = useState(null);
  const [showProvPicker, setShowProvPicker] = useState(false);

  const cargar = useCallback(() => {
    setGastos(getGastos(meses[mesIdx].val));
    setProveedores(getProveedores());
  }, [mesIdx]);

  useFocusEffect(cargar);

  function abrirNuevo() {
    setEditId(null); setFecha(hoy()); setCantidad(''); setConcepto(''); setProveedorId(null);
    setModal(true);
  }

  function abrirEditar(g) {
    setEditId(g.id); setFecha(g.fecha); setCantidad(String(g.cantidad)); setConcepto(g.concepto); setProveedorId(g.proveedor_id);
    setModal(true);
  }

  function guardar() {
    if (!fecha || !concepto || !cantidad) { Alert.alert('Error', 'Completa los campos'); return; }
    if (editId) {
      updateGasto(editId, fecha, proveedorId, concepto, parseFloat(cantidad));
    } else {
      addGasto(fecha, proveedorId, concepto, parseFloat(cantidad));
    }
    setModal(false);
    cargar();
  }

  function eliminar(id) {
    Alert.alert('Eliminar', '¿Eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteGasto(id); cargar(); } }
    ]);
  }

  const totalMes = gastos.reduce((s, g) => s + g.cantidad, 0);
  const provNombre = proveedorId ? proveedores.find(p => p.id === proveedorId)?.nombre : 'Sin proveedor';

  return (
    <View style={s.container}>
      <View style={s.mesRow}>
        <TouchableOpacity onPress={() => setMesIdx(i => Math.min(i + 1, meses.length - 1))} style={s.mesBtn}>
          <Text style={s.mesBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.mesLabel}>{meses[mesIdx].label.toUpperCase()}</Text>
        <TouchableOpacity onPress={() => setMesIdx(i => Math.max(i - 1, 0))} style={s.mesBtn}>
          <Text style={s.mesBtnTxt}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.totalBar}>
        <Text style={s.totalLabel}>TOTAL DEL MES</Text>
        <Text style={s.totalValue}>{totalMes.toFixed(2)} €</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {gastos.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>🧾</Text><Text style={s.emptyTxt}>Sin gastos este mes</Text></View>
        ) : gastos.map(g => (
          <View key={g.id} style={s.item}>
            <View style={s.itemLeft}>
              <Text style={s.itemConcepto}>{g.concepto}</Text>
              <Text style={s.itemSub}>{g.fecha}{g.proveedor_nombre ? ' · ' + g.proveedor_nombre : ''}</Text>
            </View>
            <Text style={s.itemAmt}>{g.cantidad.toFixed(2)} €</Text>
            <TouchableOpacity onPress={() => abrirEditar(g)} style={s.iconBtn}><Text style={s.iconBtnTxt}>✎</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => eliminar(g.id)} style={[s.iconBtn, s.iconBtnDanger]}><Text style={[s.iconBtnTxt, { color: C.red }]}>×</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={abrirNuevo}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>{editId ? 'Editar' : 'Nuevo'} <Text style={{ color: C.red, fontStyle: 'italic' }}>gasto</Text></Text>
            <Text style={s.fieldLabel}>FECHA</Text>
            <TextInput style={s.input} value={fecha} onChangeText={setFecha} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted} />
            <Text style={s.fieldLabel}>CANTIDAD (€)</Text>
            <TextInput style={s.input} value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.muted} />
            <Text style={s.fieldLabel}>PROVEEDOR</Text>
            <TouchableOpacity style={s.input} onPress={() => setShowProvPicker(true)}>
              <Text style={{ color: proveedorId ? C.text : C.muted, fontSize: 15 }}>{provNombre}</Text>
            </TouchableOpacity>
            <Text style={s.fieldLabel}>CONCEPTO</Text>
            <TextInput style={s.input} value={concepto} onChangeText={setConcepto} placeholder="Ej: Pedido cervezas, factura luz..." placeholderTextColor={C.muted} />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={() => setModal(false)}><Text style={s.btnCancelTxt}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnRed]} onPress={guardar}><Text style={s.btnTxt}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Proveedor picker */}
      <Modal visible={showProvPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Elegir <Text style={{ color: C.red, fontStyle: 'italic' }}>proveedor</Text></Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity style={s.provOption} onPress={() => { setProveedorId(null); setShowProvPicker(false); }}>
                <Text style={[s.provOptionTxt, !proveedorId && { color: C.red }]}>Sin proveedor</Text>
              </TouchableOpacity>
              {proveedores.map(p => (
                <TouchableOpacity key={p.id} style={s.provOption} onPress={() => { setProveedorId(p.id); setShowProvPicker(false); }}>
                  <Text style={[s.provOptionTxt, proveedorId === p.id && { color: C.red }]}>{p.nombre}</Text>
                  {p.categoria ? <Text style={s.provOptionSub}>{p.categoria}</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#080808', borderBottomWidth: 1, borderBottomColor: C.border },
  mesBtn: { padding: 8 },
  mesBtnTxt: { color: C.text, fontSize: 24, lineHeight: 24 },
  mesLabel: { color: C.muted, fontSize: 11, letterSpacing: 2 },
  totalBar: { backgroundColor: C.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: C.muted, fontSize: 9, letterSpacing: 2 },
  totalValue: { color: C.red, fontSize: 24, fontWeight: '300' },
  scroll: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTxt: { color: C.muted, fontSize: 12, letterSpacing: 1 },
  item: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemLeft: { flex: 1 },
  itemConcepto: { color: C.text, fontSize: 14 },
  itemSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  itemAmt: { color: C.red, fontSize: 18, fontWeight: '300' },
  iconBtn: { width: 32, height: 32, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { borderColor: '#3a1a1a' },
  iconBtnTxt: { color: C.muted, fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.red, shadowOpacity: 0.4, shadowRadius: 10 },
  fabTxt: { color: '#fff', fontSize: 30, lineHeight: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: '400', color: C.text, marginBottom: 20 },
  fieldLabel: { color: C.muted, fontSize: 9, letterSpacing: 2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 15, justifyContent: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel: { borderWidth: 1, borderColor: C.border },
  btnCancelTxt: { color: C.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  btnRed: { backgroundColor: C.red },
  btnTxt: { color: '#fff', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  provOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  provOptionTxt: { color: C.text, fontSize: 15 },
  provOptionSub: { color: C.muted, fontSize: 11, marginTop: 2 },
});
