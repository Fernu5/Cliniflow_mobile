import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function HomeScreen() {
  const router = useRouter();
  const { id, nome } = useLocalSearchParams(); 

  const [abaAtiva, setAbaAtiva] = useState('ativas');
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [atualizarLista, setAtualizarLista] = useState(false);
  
  const [badgeVisivel, setBadgeVisivel] = useState(false); 
  const [naoLidas, setNaoLidas] = useState(0); 
  
  const [minhasConsultas, setMinhasConsultas] = useState<any[]>([]);
  const [historicoConsultas, setHistoricoConsultas] = useState<any[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]); 
  const [carregando, setCarregando] = useState(true);

  const IP = '192.168.1.12';

  const letraAvatar = nome ? nome.toString().charAt(0).toUpperCase() : 'P';
  const primeiroNome = nome ? nome.toString().split(' ')[0] : 'Paciente';

  useFocusEffect(
    useCallback(() => {
      const buscarDados = async () => {
        if (!id) {
          setCarregando(false);
          return;
        }

        setCarregando(true); 
        
        try {
          const idLimpo = Array.isArray(id) ? id[0] : id;
          const timestamp = new Date().getTime(); 
          
          const resposta = await fetch(`http://${IP}:3000/paciente/${idLimpo}/dashboard?t=${timestamp}`);
          const dados = await resposta.json();
          if (dados) {
            setMinhasConsultas(dados.proximasConsultas || []);
            setHistoricoConsultas(dados.historicoConsultas || []);
          }

          const resNotif = await fetch(`http://${IP}:3000/paciente/${idLimpo}/notificacoes?t=${timestamp}`);
          const dadosNotif = await resNotif.json();
          setNotificacoes(dadosNotif);

          const qtdSalvaStr = await AsyncStorage.getItem(`@notif_lidas_${idLimpo}`);
          const qtdLidas = qtdSalvaStr ? parseInt(qtdSalvaStr) : 0;

          const quantidadeNovas = dadosNotif.length - qtdLidas;

          if (quantidadeNovas > 0) {
            setBadgeVisivel(true);
            setNaoLidas(quantidadeNovas);
          } else {
            setBadgeVisivel(false);
            setNaoLidas(0);
          }

        } catch (error) {
          console.error("Erro ao buscar dados do paciente:", error);
        } finally {
          setCarregando(false);
        }
      };

      buscarDados();
    }, [id, atualizarLista]) 
  );

  const proximaConsulta = minhasConsultas.length > 0 ? minhasConsultas[0] : null;

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

  const handlePerfil = () => {
    router.push({ pathname: '/perfil', params: { id: id } });
  };

  const handleMarcarConsulta = () => {
    router.push({ pathname: '/agendamento', params: { id: id } });
  };

  const handleAbrirNotificacoes = async () => {
    setMostrarNotificacoes(true);
    setBadgeVisivel(false); 
    setNaoLidas(0); 
    
    try {
      const idLimpo = Array.isArray(id) ? id[0] : id;
      await AsyncStorage.setItem(`@notif_lidas_${idLimpo}`, notificacoes.length.toString());
    } catch (error) {
      console.error("Erro ao salvar no AsyncStorage", error);
    }
  };

  const handleCancelarConsulta = (consulta: any) => {
    if (consulta.status === 'Agendada') {
      const [dia, mes, ano] = consulta.data.split('/');
      const [hora, minuto] = consulta.hora.split(':');
      
      const dataConsulta = new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
      const agora = new Date();

      const diferencaHoras = (dataConsulta.getTime() - agora.getTime()) / (1000 * 60 * 60);

      if (diferencaHoras < 24) {
        Alert.alert(
          "Cancelamento Bloqueado",
          "Consultas agendadas só podem ser canceladas com no mínimo 24 horas de antecedência."
        );
        return; 
      }
    }

    Alert.alert(
      "Confirmar Cancelamento",
      "Tem certeza que deseja cancelar? Lembre-se que cancelamentos só podem ser feitos com mais de 24 horas de antecedência.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            setCarregando(true);
            try {
              const endpoint = consulta.status === 'Agendada' 
                ? `http://${IP}:3000/consulta/${consulta.id}/cancelar`
                : `http://${IP}:3000/fila/${consulta.id}/sair`;

              // 🔴 A MÁGICA ESTÁ AQUI: Identificamos o método HTTP correto para cada rota
              const metodoHttp = consulta.status === 'Agendada' ? 'PATCH' : 'PUT';

              const resposta = await fetch(endpoint, { method: metodoHttp });
              
              if (resposta.ok) {
                Alert.alert("Sucesso", "Cancelamento realizado com sucesso.");
                setAtualizarLista(prev => !prev); 
              } else {
                Alert.alert("Erro", "Não foi possível realizar o cancelamento.");
              }
            } catch (error) {
              Alert.alert("Erro", "Falha de conexão com o servidor.");
            } finally {
              setCarregando(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileButton} onPress={handlePerfil}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{letraAvatar}</Text>
            </View>
            
            <View style={styles.profileTextContainer}>
              <Text style={styles.greeting}>Bem-vindo,</Text>
              <Text style={styles.userName}>{primeiroNome}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0AEC0" style={{ marginLeft: 8, marginTop: 12 }} />
          </TouchableOpacity>
          
          <View style={styles.headerIcons}>
            
            <TouchableOpacity style={styles.iconButton} onPress={handleAbrirNotificacoes}>
              <View>
                <Ionicons name="notifications-outline" size={24} color="#2D3748" />
                {badgeVisivel && naoLidas > 0 && (
                  <View style={styles.notificationDot}>
                    <Text style={styles.notificationDotText}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        </View>

        {proximaConsulta ? (
          <View style={styles.nextConsultationCard}>
            <Text style={styles.cardTitle}>Próxima consulta</Text>
            <Text style={styles.doctorName}>{proximaConsulta.medico}</Text>
            <View style={styles.consultationDetails}>
              <Ionicons name="time-outline" size={16} color="#FFF" style={{marginRight: 4}} />
              <Text style={styles.cardSubtitle}>{proximaConsulta.data}, {proximaConsulta.hora} - {proximaConsulta.especialidade}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.nextConsultationCard, { backgroundColor: '#718096' }]}>
            <Text style={styles.cardTitle}>Agenda Livre</Text>
            <Text style={styles.doctorName}>Nenhuma consulta</Text>
            <Text style={styles.cardSubtitle}>Você não tem consultas agendadas.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.mainActionButton} onPress={handleMarcarConsulta}>
          <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          <Text style={styles.mainActionText}>Agendar Nova Consulta</Text>
        </TouchableOpacity>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Minhas Consultas</Text>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tabButton, abaAtiva === 'ativas' && styles.tabButtonActive]} onPress={() => setAbaAtiva('ativas')}>
              <Text style={[styles.tabText, abaAtiva === 'ativas' && styles.tabTextActive]}>Ativas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.tabButton, abaAtiva === 'historico' && styles.tabButtonActive]} onPress={() => setAbaAtiva('historico')}>
              <Text style={[styles.tabText, abaAtiva === 'historico' && styles.tabTextActive]}>Histórico</Text>
            </TouchableOpacity>
          </View>

          {carregando ? (
             <ActivityIndicator size="large" color="#12A388" style={{ marginTop: 20 }} />
          ) : abaAtiva === 'ativas' ? (
            <View style={styles.listContainer}>
              {minhasConsultas.length > 0 ? (
                minhasConsultas.map((consulta) => (
                  <TouchableOpacity 
                    key={`${consulta.status}-${consulta.id}`} 
                    style={styles.consultaCard} 
                    activeOpacity={0.7}
                    onPress={() => {
                      if (consulta.status === 'Em espera') {
                        router.push({ 
                          pathname: '/lista-espera', 
                          params: { id: id, filaId: consulta.id } 
                        });
                      }
                    }}
                  >
                    <View style={styles.consultaHeader}>
                      <Text style={styles.consultaMedico}>{consulta.medico}</Text>
                      
                      <View style={[
                        styles.badge, 
                        consulta.status === 'Agendada' ? styles.badgeConfirmada : styles.badgePendente
                      ]}>
                        <Text style={
                          consulta.status === 'Agendada' ? styles.badgeTextConfirmada : styles.badgeTextPendente
                        }>
                          {consulta.status}
                        </Text>
                      </View>

                    </View>
                    
                    <Text style={styles.consultaEspecialidade}>{consulta.especialidade}</Text>
                    
                    <View style={styles.consultaFooter}>
                      <View style={styles.consultaDataContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#718096" style={{marginRight: 6}} />
                        <Text style={styles.consultaData}>{consulta.data} às {consulta.hora}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.cancelarButton} 
                        onPress={() => handleCancelarConsulta(consulta)}
                      >
                        <Text style={styles.cancelarButtonText}>
                          {consulta.status === 'Em espera' ? 'Sair' : 'Cancelar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Nenhuma consulta ativa encontrada.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {historicoConsultas.length > 0 ? (
                historicoConsultas.map((consulta) => (
                  <View key={`hist-${consulta.id}`} style={styles.consultaCard}>
                    <View style={styles.consultaHeader}>
                      <Text style={styles.consultaMedico}>{consulta.medico}</Text>
                      
                      <View style={[
                        styles.badge, 
                        consulta.status === 'Realizada' ? styles.badgeRealizada : styles.badgeCancelada
                      ]}>
                        <Text style={
                          consulta.status === 'Realizada' ? styles.textRealizada : styles.textCancelada
                        }>
                          {consulta.status}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.consultaEspecialidade}>{consulta.especialidade}</Text>
                    
                    <View style={styles.consultaFooter}>
                      <View style={styles.consultaDataContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#718096" style={{marginRight: 6}} />
                        <Text style={styles.consultaData}>{consulta.data} às {consulta.hora}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Seu histórico de consultas aparecerá aqui.</Text>
                </View>
              )}
            </View>
          )}
        </View>

      </ScrollView>

      <Modal visible={mostrarNotificacoes} transparent={true} animationType="fade" onRequestClose={() => setMostrarNotificacoes(false)}>
        <TouchableWithoutFeedback onPress={() => setMostrarNotificacoes(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.notificationBalloon}>
                <View style={styles.balloonArrow} />
                <ScrollView style={styles.notificationList}>
                  
                  {notificacoes.length > 0 ? (
                    notificacoes.map((notif) => (
                      <View key={notif.id} style={styles.notificationItem}>
                        <View style={[styles.notifIconBox, styles[`notifIcon_${notif.tipo}`]]}>
                          <Ionicons 
                            name={notif.tipo === 'sucesso' ? 'checkmark' : notif.tipo === 'alerta' ? 'notifications' : notif.tipo === 'erro' ? 'close' : 'information'} 
                            size={16} 
                            color={notif.tipo === 'sucesso' ? '#38B2AC' : notif.tipo === 'alerta' ? '#D69E2E' : notif.tipo === 'erro' ? '#E53E3E' : '#718096'} 
                          />
                        </View>
                        <View style={styles.notifContent}>
                          <Text style={styles.notifTitle}>{notif.titulo}</Text>
                          <Text style={styles.notifDesc}>{notif.desc}</Text>
                          <Text style={styles.notifTime}>{notif.tempo}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{ textAlign: 'center', padding: 20, color: '#A0AEC0' }}>Você não possui notificações.</Text>
                  )}

                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  container: { padding: 24, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  profileButton: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#12A388', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  greeting: { fontSize: 14, color: '#718096' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 16, padding: 4 },
  
  notificationDot: { position: 'absolute', top: -4, right: -4, backgroundColor: '#E53E3E', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  notificationDotText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  nextConsultationCard: { backgroundColor: '#12A388', borderRadius: 16, padding: 24, marginBottom: 16 },
  cardTitle: { color: '#E6FFFA', fontSize: 14, marginBottom: 8 },
  doctorName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  consultationDetails: { flexDirection: 'row', alignItems: 'center' },
  cardSubtitle: { color: '#E6FFFA', fontSize: 14 },
  mainActionButton: { backgroundColor: '#2D3748', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 32 },
  mainActionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: '#12A388' },
  tabText: { fontSize: 16, color: '#A0AEC0', fontWeight: '500' },
  tabTextActive: { color: '#12A388', fontWeight: 'bold' },
  listContainer: { gap: 12 }, 
  consultaCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  consultaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  consultaMedico: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  consultaEspecialidade: { fontSize: 14, color: '#A0AEC0', marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeConfirmada: { backgroundColor: '#E6FFFA' }, 
  badgeTextConfirmada: { color: '#12A388', fontSize: 12, fontWeight: 'bold' },
  badgePendente: { backgroundColor: '#FEFCBF' }, 
  badgeTextPendente: { color: '#D69E2E', fontSize: 12, fontWeight: 'bold' }, 
  
  badgeRealizada: { backgroundColor: '#E6FFFA' },
  textRealizada: { color: '#38B2AC', fontSize: 12, fontWeight: 'bold' },
  badgeCancelada: { backgroundColor: '#FFF5F5' },
  textCancelada: { color: '#E53E3E', fontSize: 12, fontWeight: 'bold' },

  consultaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consultaDataContainer: { flexDirection: 'row', alignItems: 'center' },
  consultaData: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  cancelarButton: { borderWidth: 1, borderColor: '#FEB2B2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cancelarButtonText: { color: '#E53E3E', fontSize: 12, fontWeight: 'bold' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { color: '#A0AEC0', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  notificationBalloon: { position: 'absolute', top: 45, right: 24, width: 320, maxHeight: 400, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  balloonArrow: { position: 'absolute', top: -8, right: 55, width: 16, height: 16, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#E2E8F0' },
  notificationList: { paddingVertical: 8 },
  notificationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', alignItems: 'flex-start' },
  notifIconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifIcon_sucesso: { backgroundColor: '#E6FFFA' },
  notifIcon_alerta: { backgroundColor: '#FEFCBF' },
  notifIcon_erro: { backgroundColor: '#FED7D7' },
  notifIcon_info: { backgroundColor: '#EDF2F7' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
  notifDesc: { fontSize: 12, color: '#718096', marginBottom: 4 },
  notifTime: { fontSize: 10, color: '#A0AEC0' },
});