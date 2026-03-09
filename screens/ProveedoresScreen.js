import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProveedores, addProveedor, updateProveedor, deleteProveedor, getResumen } from '../database';

const C = {
  bg: '#0a0a0a', surface: '#141414', surface2: '#1c1c1c',
  border: '#2c2c2c', red: '#e8003a', gold: '#c9a84c',
  green: '#2ecc71', text: '#f0f0f0', muted: '#666',
};

const CATEGORIAS = ['Bebidas', 'Alimentación', 'Limpieza', 'Mantenimiento', 'Suministros', 'Otros'];

function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ProveedoresScreen() {
  const [proveedores, setProveedores] = useState([]);
  const [gastosMap, setGastosMap] = useState({});
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const cargar = useCallback(() => {
    const provs = getProveedores();
    setProveedores(provs);
    const resumen = getResumen(getMesActual());
    const map = {};
    resumen.porProveedor.forEach(p => { map[p.nombre] = p.total; });
    setGastosMap(map);
  }, []);

  useFocusEffect(cargar);

  function abrirNuevo() {
    setEditId(null); setNombre(''); setCategoria(''); setTelefono(''); setNotas('');
    setModal(true);
  }

  function abrirEditar(p) {
    setEditId(p.id); setNombre(p.nombre); setCategoria(p.categoria || ''); setTelefono(p.telefono || ''); setNotas(p.notas || '');
    setModal(true);
  }

  function guardar() {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (editId) {
      updateProveedor(editId, nombre.trim(), categoria, telefono, notas);
    } else {
      addProveedor(nombre.trim(), categoria, telefono, notas);
    }
    setModal(false);
    cargar();
  }

  function eliminar(id) {
    Alert.alert('Eliminar', '¿Eliminar este proveedor? Los gastos asociados quedarán sin proveedor.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteProveedor(id); cargar(); } }
    ]);
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        {proveedores.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>🏢</Text><Text style={s.emptyTxt}>Sin proveedores todavía</Text></View>
        ) : proveedores.map(p => (
          <View key={p.id} style={s.card}>
            <Text style={s.provName}>{p.nombre}</Text>
            {p.categoria ? <Text style={s.provDetail}>📦 {p.categoria}</Text> : null}
            {p.telefono ? <Text style={s.provDetail}>📞 {p.telefono}</Text> : null}
            {p.notas ? <Text style={s.provNotas}>{p.notas}</Text> : null}
            <Text style={s.provGasto}>{(gastosMap[p.nombre] || 0).toFixed(2)} €</Text>
            <Text style={s.provGastoLabel}>GASTADO ESTE MES</Text>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => abrirEditar(p)}>
                <Text style={s.actionBtnTxt}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => eliminar(p.id)}>
                <Text style={[s.actionBtnTxt, { color: C.red }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={s.modalTitle}>{editId ? 'Editar' : 'Nuevo'} <Text style={{ color: C.red, fontStyle: 'italic' }}>proveedor</Text></Text>
            <Text style={s.fieldLabel}>NOMBRE</Text>
            <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Distribuciones García..." placeholderTextColor={C.muted} />
            <Text style={s.fieldLabel}>CATEGORÍA</Text>
            <TouchableOpacity style={s.input} onPress={() => setShowCatPicker(true)}>
              <Text style={{ color: categoria ? C.text : C.muted, fontSize: 15 }}>{categoria || '— Elegir —'}</Text>
            </TouchableOpacity>
            <Text style={s.fieldLabel}>TELÉFONO</Text>
            <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="600 000 000" placeholderTextColor={C.muted} keyboardType="phone-pad" />
            <Text style={s.fieldLabel}>NOTAS</Text>
            <TextInput style={[s.input, s.textarea]} value={notas} onChangeText={setNotas} multiline placeholder="Días de reparto, condiciones..." placeholderTextColor={C.muted} />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={() => setModal(false)}><Text style={s.btnCancelTxt}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnRed]} onPress={guardar}><Text style={s.btnTxt}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCatPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Categoría</Text>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity key={cat} style={s.provOption} onPress={() => { setCategoria(cat); setShowCatPicker(false); }}>
                <Text style={[s.provOptionTxt, categoria === cat && { color: C.red }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTxt: { color: C.muted, fontSize: 12, letterSpacing: 1 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 16, marginBottom: 12 },
  provName: { fontSize: 20, color: C.text, fontWeight: '400', marginBottom: 6 },
  provDetail: { color: C.muted, fontSize: 12, marginBottom: 3 },
  provNotas: { color: C.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 3 },
  provGasto: { color: C.red, fontSize: 26, fontWeight: '300', marginTop: 10 },
  provGastoLabel: { color: C.muted, fontSize: 9, letterSpacing: 2, marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center' },
  actionBtnDanger: { borderColor: '#3a1a1a' },
  actionBtnTxt: { color: C.muted, fontSize: 12, letterSpacing: 0.5 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.gold, shadowOpacity: 0.4, shadowRadius: 10 },
  fabTxt: { color: '#000', fontSize: 30, lineHeight: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: '400', color: C.text, marginBottom: 20 },
  fieldLabel: { color: C.muted, fontSize: 9, letterSpacing: 2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 15, justifyContent: 'center' },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel: { borderWidth: 1, borderColor: C.border },
  btnCancelTxt: { color: C.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  btnRed: { backgroundColor: C.red },
  btnTxt: { color: '#fff', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  provOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  provOptionTxt: { color: C.text, fontSize: 15 },
});
