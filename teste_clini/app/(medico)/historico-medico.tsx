import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HistoricoMedicoScreen() {
  const router = useRouter();
  
  const [busca, setBusca] = useState('');

  /*const historicoAtendimentos = [
    { id: '1', paciente: 'William Ferreira', especialidade: 'Ortopedia', status: 'Realizada', dataHora: '12/05 16h20' },
    { id: '2', paciente: 'Fernando Sadoc', especialidade: 'Reumatologia', status: 'Realizada', dataHora: '12/05 15h00' },
    { id: '3', paciente: 'Eduardo Teles', especialidade: 'Fisiatria', status: 'Cancelada', dataHora: '12/05 14h30' },
    { id: '4', paciente: 'Maria Silva', especialidade: 'Ortopedia', status: 'Realizada', dataHora: '10/05 09h00' },
  ];*/

  const atendimentosFiltrados = historicoAtendimentos.filter(atendimento => 
    atendimento.paciente.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home-medico')}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Histórico de atendimentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color="#12A388" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Buscar por nome:</Text>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="digite um nome..."
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        
        <View style={styles.tableLegend}>
          <Text style={styles.legendText}>Paciente / Info</Text>
          <Text style={styles.legendText}>Status / Ação</Text>
        </View>

        {atendimentosFiltrados.length > 0 ? (
          atendimentosFiltrados.map((item) => (
            <View key={item.id} style={styles.card}>
              
              <View style={styles.cardRow}>
                <View style={styles.infoLeft}>
                  <Text style={styles.pacienteNome}>{item.paciente}</Text>
                  <Text style={styles.especialidadeText}>{item.especialidade}</Text>
                  <View style={styles.dataContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#718096" style={{marginRight: 4}} />
                    <Text style={styles.dataText}>{item.dataHora}</Text>
                  </View>
                </View>

                <View style={styles.infoRight}>
                  <View style={[
                    styles.badge, 
                    item.status === 'Realizada' ? styles.badgeRealizada : styles.badgeCancelada
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      item.status === 'Realizada' ? styles.textRealizada : styles.textCancelada
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.relatorioButton, item.status === 'Cancelada' && styles.relatorioButtonDisabled]}
                    disabled={item.status === 'Cancelada'}
                    onPress={() => console.log(`Abrindo prontuário de ${item.paciente}`)}
                  >
                    <Text style={[styles.relatorioButtonText, item.status === 'Cancelada' && styles.relatorioButtonTextDisabled]}>
                      Ver Relatório
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyStateText}>Nenhum paciente encontrado com "{busca}".</Text>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="arrow-down-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.exportButtonText}>Exportar / Imprimir</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  bellButton: { padding: 4 },
  
  searchContainer: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
  searchLabel: { fontSize: 14, color: '#718096', marginRight: 12, fontWeight: '500' },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#2D3748' },

  listContainer: { padding: 24, paddingBottom: 100 },
  
  tableLegend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  legendText: { fontSize: 12, color: '#A0AEC0', fontWeight: 'bold', textTransform: 'uppercase' },

  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  infoLeft: { flex: 1, paddingRight: 12 },
  pacienteNome: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
  especialidadeText: { fontSize: 14, color: '#718096', marginBottom: 8 },
  dataContainer: { flexDirection: 'row', alignItems: 'center' },
  dataText: { fontSize: 12, color: '#4A5568', fontWeight: '500' },
  
  infoRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  badgeRealizada: { backgroundColor: '#E6FFFA' },
  badgeCancelada: { backgroundColor: '#FED7D7' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  textRealizada: { color: '#38B2AC' },
  textCancelada: { color: '#E53E3E' },
  
  relatorioButton: { backgroundColor: '#E6FFFA', borderWidth: 1, borderColor: '#38B2AC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  relatorioButtonText: { color: '#38B2AC', fontSize: 12, fontWeight: 'bold' },
  relatorioButtonDisabled: { backgroundColor: '#F7FAFC', borderColor: '#E2E8F0' },
  relatorioButtonTextDisabled: { color: '#A0AEC0' },

  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyStateText: { marginTop: 12, color: '#A0AEC0', fontSize: 14, textAlign: 'center' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5 },
  exportButton: { backgroundColor: '#12A388', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  exportButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});