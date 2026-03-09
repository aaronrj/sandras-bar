import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { initDB } from './database';

import DashboardScreen from './screens/DashboardScreen';
import GastosScreen from './screens/GastosScreen';
import IngresosScreen from './screens/IngresosScreen';
import ProveedoresScreen from './screens/ProveedoresScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: '#0a0a0a',
  surface: '#141414',
  border: '#2c2c2c',
  red: '#e8003a',
  gold: '#c9a84c',
  green: '#2ecc71',
  text: '#f0f0f0',
  muted: '#666',
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    try {
      initDB();
      setDbReady(true);
    } catch (error) {
      console.error('Error inicializando la base de datos:', error);
    }
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#080808',
            borderBottomColor: COLORS.border,
            borderBottomWidth: 1,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontFamily: 'serif',
            fontSize: 20,
          },
          tabBarStyle: {
            backgroundColor: '#080808',
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.red,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarLabelStyle: {
            fontSize: 10,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: "Sandra's Bar",
            tabBarLabel: 'Resumen',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>◈</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Ingresos"
          component={IngresosScreen}
          options={{
            title: 'Caja diaria',
            tabBarLabel: 'Ingresos',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>↑</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Gastos"
          component={GastosScreen}
          options={{
            title: 'Gastos',
            tabBarLabel: 'Gastos',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>↓</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Proveedores"
          component={ProveedoresScreen}
          options={{
            title: 'Proveedores',
            tabBarLabel: 'Proveedores',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>◎</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}