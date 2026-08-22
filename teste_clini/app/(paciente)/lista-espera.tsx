import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ListaEsperaScreen() {
  const router = useRouter();
  
  const { id, filaId } = useLocalSearchParams(); 

  const IP = '192.168.1.12';

  const [fila, setFila] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const buscarFila = async () => {
    if (!id) return;
    setCarregando(true);
    try {
      const idLimpo = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
      const resposta = await fetch(`http://${IP}:3000/paciente/${idLimpo}/fila`);
      const dados = await resposta.json();
      
      if (filaId) {
        const idFilaDesejada = Array.isArray(filaId) ? filaId[0] : filaId;
        const filaFiltrada = dados.filter((item: any) => String(item.id) === String(idFilaDesejada));
        setFila(filaFiltrada);
      } else {
        setFila(dados);
      }

    } catch (error) {
      console.error("Erro ao carregar fila:", error);
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarFila();
    }, [id, filaId])
  );

  const handleSairDaFila = (idItem: string, medico: string) => {
    Alert.alert(
      "Sair da Fila",
      `Tem certeza que deseja sair da lista de espera para ${medico}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, sair", 
          style: "destructive",
          onPress: async () => {
            try {
              const resposta = await fetch(`http://${IP}:3000/fila/${idItem}/sair`, {
                method: 'PUT'
              });
              if (resposta.ok) {
                Alert.alert("Sucesso", "Você foi removido da lista de espera.", [
                  { text: "OK", onPress: () => router.back() }
                ]);
              }
            } catch (error) {
              Alert.alert("Erro", "Falha ao conectar com o servidor.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Lista de Espera</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {carregando ? (
          <ActivityIndicator size="large" color="#12A388" style={{ marginTop: 40 }} />
        ) : fila.length > 0 ? (
          <View style={styles.listContainer}>
            {fila.map((item) => (
              <View key={item.id} style={styles.card}>
                
                <View style={styles.positionCircle}>
                  <Text style={styles.positionText}>#{item.posicao}</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.medicoName}>{item.medico}</Text>
                  <Text style={styles.detailsText}>{item.especialidade} • {item.dataHora}</Text>
                  
                  <View style={styles.actionsRow}>
                    <View style={styles.badgeFila}>
                      <Text style={styles.badgeFilaText}>Na fila</Text>
                    </View>
                    
                    <TouchableOpacity onPress={() => handleSairDaFila(item.id, item.medico)}>
                      <Text style={styles.sairFilaText}>Sair da fila</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            ))}
            <Text style={styles.footerText}>Você será notificado quando uma vaga abrir.</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="calendar-outline" size={48} color="#A0AEC0" />
            <Text style={{ color: '#A0AEC0', marginTop: 16, textAlign: 'center' }}>
              Você não está em nenhuma lista de espera no momento.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  container: { padding: 24 },
  listContainer: { gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'flex-start' },
  positionCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6FFFA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  positionText: { color: '#12A388', fontSize: 18, fontWeight: 'bold' },
  infoContainer: { flex: 1 },
  medicoName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  detailsText: { fontSize: 14, color: '#A0AEC0', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  badgeFila: { backgroundColor: '#E6FFFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 16 },
  badgeFilaText: { color: '#12A388', fontSize: 12, fontWeight: 'bold' },
  sairFilaText: { color: '#E53E3E', fontSize: 14, fontWeight: '500' },
  footerText: { textAlign: 'center', color: '#A0AEC0', fontSize: 14, marginTop: 32 },
});