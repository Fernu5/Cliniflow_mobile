import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HistoricoGeralScreen() {
  const router = useRouter();

  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const filtros = ['Todos', 'Realizadas', 'Canceladas', 'Pendentes'];

  // Estados para gerenciar os dados vindos do MySQL
  const [historicoConsultas, setHistoricoConsultas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarConsultas = async () => {
      try {
        const resposta = await fetch('http://192.168.1.12:3000/consultas'); 
        const dados = await resposta.json();
        setHistoricoConsultas(dados);
      } catch (error) {
        console.error("Erro ao conectar com a API de consultas:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarConsultas();
  }, []);

  // Filtragem
  const consultasFiltradas = historicoConsultas.filter(consulta => {
    if (filtroAtivo === 'Todos') return true;
    return filtroAtivo.startsWith(consulta.status); 
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Consultas</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12A388" />
          <Text style={styles.loadingText}>Buscando consultas...</Text>
        </View>
      ) : (
        <>
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              {filtros.map((filtro) => (
                <TouchableOpacity 
                  key={filtro}
                  style={[styles.filterPill, filtroAtivo === filtro && styles.filterPillActive]}
                  onPress={() => setFiltroAtivo(filtro)}
                >
                  <Text style={[styles.filterText, filtroAtivo === filtro && styles.filterTextActive]}>
                    {filtro}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.listContainer}>
            
            {consultasFiltradas.length > 0 ? (
              consultasFiltradas.map((item) => (
                
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card}
                  activeOpacity={0.7}
                  //onPress={() => router.push('/detalhes-historico-geral')}
                  onPress={() => router.push({ pathname: '/detalhes-historico-geral', params: { id: item.id } })}
                >
                  <View style={styles.cardContent}>
                    
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <Ionicons name="person" size={14} color="#4A5568" style={styles.icon} />
                        <Text style={styles.pacienteText}>{item.paciente}</Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Ionicons name="medkit" size={14} color="#D69E2E" style={styles.icon} />
                        <Text style={styles.medicoText}>{item.medico}</Text>
                      </View>
                      
                      <Text style={styles.detalhesText}>
                        {item.especialidade} · {item.data} às {item.hora}
                      </Text>
                    </View>

                    <View style={styles.badgeSection}>
                      <View style={[
                        styles.badge,
                        item.status === 'Realizada' ? styles.badgeRealizada :
                        item.status === 'Pendente' ? styles.badgePendente :
                        styles.badgeCancelada
                      ]}>
                        <Text style={[
                          styles.badgeText,
                          item.status === 'Realizada' ? styles.textRealizada :
                          item.status === 'Pendente' ? styles.textPendente :
                          styles.textCancelada
                        ]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>Nenhuma consulta encontrada.</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#A0AEC0', fontSize: 16 },

  filtersContainer: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filtersScroll: { paddingHorizontal: 16 },
  filterPill: { backgroundColor: '#F7FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#12A388', borderColor: '#12A388' },
  filterText: { fontSize: 14, color: '#718096', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  listContainer: { padding: 24, paddingBottom: 48 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoSection: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  icon: { marginRight: 6 },
  pacienteText: { fontSize: 15, fontWeight: 'bold', color: '#2D3748' },
  medicoText: { fontSize: 14, color: '#718096' },
  detalhesText: { fontSize: 12, color: '#A0AEC0', marginTop: 4, marginLeft: 20 },
  badgeSection: { marginLeft: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeRealizada: { backgroundColor: '#E6FFFA' },
  textRealizada: { color: '#38B2AC' },
  badgePendente: { backgroundColor: '#FFFAF0' },
  textPendente: { color: '#DD6B20' },
  badgeCancelada: { backgroundColor: '#FFF5F5' },
  textCancelada: { color: '#E53E3E' },
  emptyState: { alignItems: 'center', marginTop: 64 },
  emptyStateText: { marginTop: 12, color: '#A0AEC0', fontSize: 14, textAlign: 'center' },
});