import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ListasEsperaAdmScreen() {
  const router = useRouter();

  const [filas, setFilas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // 🔴 COLOQUE SEU IP AQUI
  const IP = '192.168.1.12';

  // 🔥 A MÁGICA ACONTECE AQUI: useFocusEffect recarrega a tela sempre que você volta para ela
  useFocusEffect(
    useCallback(() => {
      const buscarFilas = async () => {
        setCarregando(true);
        try {
          const resposta = await fetch(`http://${IP}:3000/listas-espera`); 
          const dados = await resposta.json();
          setFilas(dados);
        } catch (error) {
          console.error("Erro ao conectar com a API de listas:", error);
        } finally {
          setCarregando(false);
        }
      };

      buscarFilas();
    }, [])
  );

  const totalFilas = filas.length;
  const totalPacientes = filas.reduce((acc, fila) => acc + fila.pacientes, 0);

  const handleVerFila = (idConsulta: string) => {
    router.push({ pathname: '/detalhes-lista-adm', params: { id: idConsulta } }); 
  };

  const handleEncerrarLista = (id: string, medico: string) => {
    Alert.alert(
      "Encerrar Lista de Espera",
      `Deseja realmente encerrar a lista de espera para ${medico}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Encerrar", 
          style: "destructive",
          onPress: async () => {
            try {
              const resposta = await fetch(`http://${IP}:3000/listas-espera/${id}/encerrar`, {
                method: 'PUT'
              });

              if (resposta.ok) {
                Alert.alert("Sucesso", "Lista encerrada e fila removida do painel.");
                setFilas(prevFilas => prevFilas.filter(fila => fila.id !== id));
              } else {
                Alert.alert("Erro", "Não foi possível encerrar a lista.");
              }
            } catch (error) {
              Alert.alert("Erro de Conexão", "Falha ao comunicar com o servidor.");
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
          <Text style={styles.headerTitle}>Listas de Espera</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12A388" />
          <Text style={styles.loadingText}>Calculando filas ativas...</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryBanner}>
            <Ionicons name="hourglass" size={16} color="#319795" style={styles.summaryIcon} />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryHighlight}>{totalFilas}</Text> filas ativas · <Text style={styles.summaryHighlight}>{totalPacientes}</Text> pacientes aguardando
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.listContainer}>
            
            {filas.length > 0 ? (
              filas.map((fila) => (
                <View key={fila.id} style={styles.card}>
                  
                  <View style={styles.cardHeader}>
                    <View style={styles.infoBlock}>
                      <Text style={styles.medicoName}>{fila.medico}</Text>
                      <Text style={styles.detailsText}>
                        {fila.especialidade} · {fila.data}, {fila.hora}
                      </Text>
                    </View>

                    <View style={styles.badgeNumber}>
                      <Text style={styles.badgeNumberText}>{fila.pacientes}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.btnVerFila]} 
                      onPress={() => handleVerFila(fila.id)}
                    >
                      <Text style={styles.textVerFila}>Ver fila</Text>
                    </TouchableOpacity>

                    <View style={{ width: 12 }} />

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.btnEncerrar]} 
                      onPress={() => handleEncerrarLista(fila.id, fila.medico)}
                    >
                      <Text style={styles.textEncerrar}>Encerrar lista</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>Todas as listas de espera foram processadas.</Text>
              </View>
            )}

          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, paddingBottom: 16, backgroundColor: '#FFF' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#A0AEC0', fontSize: 16 },

  summaryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6FFFA', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#B2F5EA' },
  summaryIcon: { marginRight: 8 },
  summaryText: { fontSize: 14, color: '#319795' },
  summaryHighlight: { fontWeight: 'bold' },

  listContainer: { padding: 24, paddingBottom: 48 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  infoBlock: { flex: 1 },
  medicoName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  detailsText: { fontSize: 13, color: '#A0AEC0' },
  badgeNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12A388', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  badgeNumberText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnVerFila: { backgroundColor: '#E6FFFA', borderColor: '#B2F5EA' },
  textVerFila: { color: '#319795', fontSize: 14, fontWeight: '600' },
  btnEncerrar: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  textEncerrar: { color: '#E53E3E', fontSize: 14, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyStateText: { marginTop: 12, color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
});