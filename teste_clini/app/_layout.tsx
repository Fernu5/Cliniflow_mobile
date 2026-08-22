import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { useEffect } from 'react';

export default function Layout() {
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#FFFFFF');
      // Força os botões (triângulo, bolinha, quadrado) a ficarem escuros
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  return (
    <>
      {/* Controla a barra de cima (Wi-Fi, Bateria) */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {/* Controla as telas do aplicativo */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}