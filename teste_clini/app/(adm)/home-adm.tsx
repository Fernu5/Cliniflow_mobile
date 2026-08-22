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
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeAdmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [estatisticas, setEstatisticas] = useState({ pacientes: 0, medicos: 0, consultasHoje: 0, listasEspera: 0 });
  const [nomeAdm, setNomeAdm] = useState('Carregando...');
  const [carregando, setCarregando] = useState(true);

  const IP = '192.168.1.12';

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        setCarregando(true);
        try {
          const respDash = await fetch(`http://${IP}:3000/dashboard-adm`);
          const dadosDash = await respDash.json();
          if (dadosDash && !dadosDash.erro) {
            setEstatisticas({
              pacientes: dadosDash.total_pacientes || 0,
              medicos: dadosDash.total_medicos || 0,
              consultasHoje: dadosDash.consultas_pendentes || 0,
              listasEspera: dadosDash.filas_ativas || 0
            });
          }

          if (id) {
            const respNome = await fetch(`http://${IP}:3000/adm/${id}/perfil`);
            const dadosNome = await respNome.json();
            if (dadosNome && !dadosNome.erro) {
              setNomeAdm(`${dadosNome.nome_usuario} ${dadosNome.sobrenome_usuario}`);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dashboard:", error);
        } finally {
          setCarregando(false);
        }
      };

      carregarDados();
    }, [id])
  );

  const handlePerfil = () => {
    router.push({ pathname: '/perfil', params: { id: id } });
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair do Sistema",
      "Tem certeza que deseja encerrar a sua sessão?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Sair", style: "destructive", onPress: () => router.replace('/') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePerfil} style={styles.profileArea}>
            <Text style={styles.greeting}>Administração</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{nomeAdm}</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFF" style={styles.chevronIcon} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsWrapper}>
          {carregando ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#12A388" />
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#E6FFFA' }]}>
                  <Text style={[styles.statNumber, { color: '#319795' }]}>{estatisticas.pacientes}</Text>
                  <Text style={styles.statLabel}>Pacientes</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#F3EBFF' }]}>
                  <Text style={[styles.statNumber, { color: '#805AD5' }]}>{estatisticas.medicos}</Text>
                  <Text style={styles.statLabel}>Médicos</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#F0FFF4' }]}>
                  <Text style={[styles.statNumber, { color: '#38A169' }]}>{estatisticas.consultasHoje}</Text>
                  <Text style={styles.statLabel}>Consultas hoje</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#FFFAF0' }]}>
                  <Text style={[styles.statNumber, { color: '#DD6B20' }]}>{estatisticas.listasEspera}</Text>
                  <Text style={styles.statLabel}>Listas de espera</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>Gerenciar</Text>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.navigate('/gerenciar-usuarios')} 
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="people" size={20} color="#4A5568" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Usuários</Text>
              <Text style={styles.actionSubtitle}>Gerenciar pacientes e médicos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.navigate('/historico-geral')}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="clipboard" size={20} color="#4A5568" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Gerenciar Consultas</Text>
              <Text style={styles.actionSubtitle}>Todas as consultas do sistema</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          {/* NOVO CARD: AGENDAS MÉDICAS */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.navigate('/gerenciar-agendas')}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="calendar" size={20} color="#4A5568" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Agendas Médicas</Text>
              <Text style={styles.actionSubtitle}>Definir horários de atendimento</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.navigate('/listas-espera-adm')}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="hourglass" size={20} color="#4A5568" />
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>Listas de Espera</Text>
              <Text style={styles.actionSubtitle}>Filas ativas no sistema</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingBottom: 48 },
  header: { backgroundColor: '#12A388', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 48, paddingBottom: 24 },
  profileArea: { flex: 1, justifyContent: 'center' },
  greeting: { fontSize: 14, color: '#E6FFFA', marginBottom: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  chevronIcon: { marginLeft: 6, marginTop: 2 }, 
  logoutButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  statsWrapper: { paddingHorizontal: 24, marginTop: 24 }, 
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#718096' },
  managementSection: { paddingHorizontal: 24, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  actionIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionTextContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
  actionSubtitle: { fontSize: 12, color: '#A0AEC0' },
});