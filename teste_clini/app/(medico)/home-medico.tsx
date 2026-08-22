import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function HomeMedicoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [dadosMedico, setDadosMedico] = useState(null);
  const [proximaConsulta, setProximaConsulta] = useState(null);
  const [estatisticas, setEstatisticas] = useState({ hoje: 0, mes: 0, total: 0 });
  const [carregando, setCarregando] = useState(true);
  
  const [agendas, setAgendas] = useState([]); 
  const [historicoAnual, setHistoricoAnual] = useState(new Array(12).fill(0));
  
  const [dataAtual, setDataAtual] = useState(new Date(2026, 7, 1)); 
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [badgeVisivel, setBadgeVisivel] = useState(false); 
  const [naoLidas, setNaoLidas] = useState(0);

  const scrollViewRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const IP = '192.168.1.12';

  useFocusEffect(
    useCallback(() => {
      const buscarDashboard = async () => {
        if (!id) return;
        setCarregando(true);
        try {
          const idLimpo = Array.isArray(id) ? id[0] : id;
          
          const resposta = await fetch(`http://${IP}:3000/medico/${idLimpo}/dashboard`);
          const dados = await resposta.json();
          
          if (dados && !dados.erro) {
            setDadosMedico(dados.medico);
            setProximaConsulta(dados.proximaConsulta);
            setEstatisticas({
              hoje: dados.estatisticas?.consultas_hoje || 0,
              mes: dados.estatisticas?.consultas_mes || 0,
              total: dados.estatisticas?.total_atendimentos || 0
            });
            setAgendas(dados.agendas || []);
            if (dados.historicoAnual) {
              setHistoricoAnual(dados.historicoAnual);
            }
          }

          const resNotif = await fetch(`http://${IP}:3000/medico/${idLimpo}/notificacoes`);
          const dadosNotif = await resNotif.json();
          setNotificacoes(dadosNotif);

          const qtdSalvaStr = await AsyncStorage.getItem(`@notif_medico_lidas_${idLimpo}`);
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
          console.error("Erro ao carregar painel do médico:", error);
        } finally {
          setCarregando(false);
        }
      };

      buscarDashboard();
    }, [id])
  );

  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const diasDoMes = useMemo(() => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    const dias = [];
    
    for (let i = 0; i < primeiroDiaDaSemana; i++) {
      dias.push({ vazio: true, id: `empty-${i}` });
    }
    
    for (let d = 1; d <= totalDiasNoMes; d++) {
      const dataFormatada = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const agendasNoDia = agendas.filter(a => a.data_agenda === dataFormatada && a.status_agenda === 'Disponivel');
      
      dias.push({ 
        vazio: false, dia: d, dataFormatada,
        temAgenda: agendasNoDia.length > 0,
        horarios: agendasNoDia
      });
    }
    return dias;
  }, [dataAtual, agendas]);

  const mudarMes = (incremento) => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + incremento, 1));
    setDiaSelecionado(null); 
  };

  const handleDiaClick = (dia) => {
    if (dia.vazio || !dia.temAgenda) return;
    setDiaSelecionado(dia.dia);
  };

  const handleLogout = () => {
    Alert.alert("Sair do Sistema", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim, Sair", style: "destructive", onPress: () => router.replace('/') }
    ]);
  };

  const handleGerenciarConsultas = () => {
    router.push({ 
      pathname: '/gerenciar-agenda', 
      params: { id: id } 
    });
  };

  const handleAbrirNotificacoes = async () => {
    setMostrarNotificacoes(true);
    setBadgeVisivel(false); 
    setNaoLidas(0); 
    
    try {
      const idLimpo = Array.isArray(id) ? id[0] : id;
      await AsyncStorage.setItem(`@notif_medico_lidas_${idLimpo}`, notificacoes.length.toString());
    } catch (error) {
      console.error("Erro ao salvar no AsyncStorage", error);
    }
  };

  const rolarGrafico = (direcao) => {
    if (scrollViewRef.current) {
      const passo = 120;
      const novoOffset = direcao === 'esq' ? scrollOffset - passo : scrollOffset + passo;
      const offsetFinal = Math.max(0, novoOffset);
      
      scrollViewRef.current.scrollTo({ x: offsetFinal, animated: true });
      setScrollOffset(offsetFinal);
    }
  };

  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const maxAtendimentos = Math.max(...historicoAnual, 1);

  const iniciais = dadosMedico 
    ? `${dadosMedico.nome[0]}${dadosMedico.sobrenome[0]}`.toUpperCase() 
    : 'MD';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/perfil', params: { id: id } })} style={styles.profileButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciais}</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.greeting}>Bem-vindo,</Text>
              <Text style={styles.userName}>{dadosMedico ? `Dr(a). ${dadosMedico.nome}` : 'Carregando...'}</Text>
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

        {carregando ? (
          <ActivityIndicator size="large" color="#12A388" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {proximaConsulta ? (
              <View style={styles.nextConsultationCard}>
                <Text style={styles.cardTitle}>Próxima consulta</Text>
                <Text style={styles.patientName}>{proximaConsulta.paciente}</Text>
                <View style={styles.consultationDetails}>
                  <Ionicons name="time-outline" size={16} color="#FFF" style={{marginRight: 4}} />
                  <Text style={styles.cardSubtitle}>Hoje, às {proximaConsulta.hora}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.nextConsultationCard, { backgroundColor: '#718096' }]}>
                <Text style={styles.cardTitle}>Agenda Livre</Text>
                <Text style={styles.patientName}>Sem pacientes</Text>
              </View>
            )}

            <TouchableOpacity style={styles.mainActionButton} onPress={handleGerenciarConsultas}>
              <Ionicons name="calendar-outline" size={24} color="#FFF" />
              <Text style={styles.mainActionText}>Visualizar Agenda Completa</Text>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{estatisticas.hoje}</Text>
                <Text style={styles.statLabel}>Hoje</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{estatisticas.mes}</Text>
                <Text style={styles.statLabel}>Este Mês</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{estatisticas.total}</Text>
                <Text style={styles.statLabel}>Total Realizadas</Text>
              </View>
            </View>

            {/* SESSÃO: SUA AGENDA (CALENDÁRIO GRADE BLINDADO) */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Sua Agenda</Text>
              
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => mudarMes(-1)} style={styles.calendarArrow}>
                    <Ionicons name="chevron-back" size={20} color="#2D3748" />
                  </TouchableOpacity>
                  
                  <Text style={styles.calendarMonthText}>
                    {mesesNomes[dataAtual.getMonth()]} {dataAtual.getFullYear()}
                  </Text>
                  
                  <TouchableOpacity onPress={() => mudarMes(1)} style={styles.calendarArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#2D3748" />
                  </TouchableOpacity>
                </View>

                {/* COLUNAS DOS DIAS DA SEMANA */}
                <View style={styles.calendarWeekDays}>
                  {diasSemana.map((dia, idx) => (
                    <View key={`week-${idx}`} style={styles.weekDayWrapper}>
                      <Text style={styles.weekDayText}>{dia}</Text>
                    </View>
                  ))}
                </View>

                {/* GRADE DOS DIAS MATEMATICAMENTE ALINHADA */}
                <View style={styles.calendarGrid}>
                  {diasDoMes.map((item, index) => {
                    if (item.vazio) {
                      return <View key={item.id} style={styles.dayWrapper} />;
                    }
                    const isSelected = diaSelecionado === item.dia;
                    const hasAgenda = item.temAgenda;

                    return (
                      <View key={item.dia} style={styles.dayWrapper}>
                        <TouchableOpacity 
                          style={[
                            styles.dayCell, 
                            hasAgenda && styles.dayCellAgenda,
                            isSelected && styles.dayCellSelected
                          ]}
                          onPress={() => handleDiaClick(item)}
                          disabled={!hasAgenda}
                        >
                          <Text style={[
                            styles.dayText, 
                            !hasAgenda && styles.dayTextDisabled,
                            hasAgenda && styles.dayTextAgenda,
                            isSelected && styles.dayTextSelected
                          ]}>
                            {item.dia}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.calendarLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#12A388' }]} />
                    <Text style={styles.legendText}>Com Agenda</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
                    <Text style={styles.legendText}>Sem Agenda</Text>
                  </View>
                </View>
              </View>

              {diaSelecionado && (
                <View style={styles.horariosContainer}>
                  <Text style={styles.horariosTitle}>Horários em {diaSelecionado} de {mesesNomes[dataAtual.getMonth()]}</Text>
                  {diasDoMes.find(d => d.dia === diaSelecionado)?.horarios?.map((hora, index) => (
                    <View key={index} style={styles.horarioCard}>
                      <Ionicons name="time-outline" size={20} color="#2D3748" />
                      <Text style={styles.horarioText}>{hora.hora_inicio} às {hora.hora_fim}</Text>
                      <Text style={styles.statusText}>{hora.status_agenda}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* SESSÃO: GRÁFICO 12 MESES */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Histórico Anual</Text>
              
              <View style={styles.chartWrapper}>
                <TouchableOpacity onPress={() => rolarGrafico('esq')} style={styles.chartNavButton}>
                  <Ionicons name="chevron-back" size={20} color="#718096" />
                </TouchableOpacity>

                <View style={styles.chartContainer}>
                  <View style={styles.chartLinesContainer}>
                    <View style={styles.chartLine} />
                    <View style={styles.chartLine} />
                    <View style={styles.chartLine} />
                  </View>

                  <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.x)}
                    scrollEventThrottle={16}
                  >
                    <View style={styles.chartBarsContainer}>
                      {mesesAbreviados.map((mes, index) => {
                        const valor = historicoAnual[index] || 0;
                        const alturaBarra = valor === 0 ? 2 : (valor / maxAtendimentos) * 100;
                        
                        return (
                          <View key={index} style={styles.barColumn}>
                            <Text style={styles.barValue}>{valor > 0 ? valor : ''}</Text>
                            <View style={styles.barBackground}>
                              <View style={[styles.barFill, { height: `${alturaBarra}%`, backgroundColor: valor > 0 ? '#12A388' : '#E2E8F0' }]} />
                            </View>
                            <Text style={styles.barLabel}>{mes}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <TouchableOpacity onPress={() => rolarGrafico('dir')} style={styles.chartNavButton}>
                  <Ionicons name="chevron-forward" size={20} color="#718096" />
                </TouchableOpacity>
              </View>
            </View>

          </>
        )}
      </ScrollView>

      {/* BALÃO DE NOTIFICAÇÕES */}
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
  profileTextContainer: { justifyContent: 'center' },
  greeting: { fontSize: 14, color: '#718096' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16, padding: 4 },
  
  notificationDot: { position: 'absolute', top: -4, right: -4, backgroundColor: '#E53E3E', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  notificationDotText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  nextConsultationCard: { backgroundColor: '#12A388', borderRadius: 16, padding: 24, marginBottom: 16, elevation: 3 },
  cardTitle: { color: '#E6FFFA', fontSize: 14, marginBottom: 8 },
  patientName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  consultationDetails: { flexDirection: 'row', alignItems: 'center' },
  cardSubtitle: { color: '#E6FFFA', fontSize: 14 },
  
  mainActionButton: { backgroundColor: '#2D3748', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 24 },
  mainActionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { backgroundColor: '#FFF', width: '31%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#12A388' },
  statLabel: { fontSize: 12, color: '#4A5568', marginTop: 4, textAlign: 'center' },

  sectionContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
  
  calendarContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarArrow: { padding: 8 }, 
  calendarMonthText: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  
  // 🔴 CORREÇÃO DO GRID DO CALENDÁRIO AQUI 👇
  calendarWeekDays: { flexDirection: 'row', marginBottom: 10 },
  weekDayWrapper: { width: '14.28%', alignItems: 'center' },
  weekDayText: { fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' },
  
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayWrapper: { width: '14.28%', alignItems: 'center', marginBottom: 10 },
  dayCell: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  
  dayCellAgenda: { backgroundColor: '#12A388' },
  dayCellSelected: { borderWidth: 2, borderColor: '#2D3748' },
  dayText: { fontSize: 14, color: '#2D3748' },
  dayTextDisabled: { color: '#CBD5E0' },
  dayTextAgenda: { color: '#FFF', fontWeight: 'bold' },
  dayTextSelected: { color: '#FFF' },
  calendarLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#718096' },

  horariosContainer: { marginTop: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  horariosTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A5568', marginBottom: 12 },
  horarioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', padding: 12, borderRadius: 8, marginBottom: 8 },
  horarioText: { fontSize: 14, color: '#2D3748', marginLeft: 8, flex: 1 },
  statusText: { fontSize: 12, color: '#12A388', fontWeight: 'bold' },

  chartWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartNavButton: { padding: 8, backgroundColor: '#EDF2F7', borderRadius: 20 },
  chartContainer: { flex: 1, marginHorizontal: 8, backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 20, borderWidth: 1, borderColor: '#E2E8F0', height: 220, justifyContent: 'flex-end', position: 'relative' },
  chartLinesContainer: { position: 'absolute', top: 20, bottom: 40, left: 0, right: 0, justifyContent: 'space-between', paddingHorizontal: 20 },
  chartLine: { height: 1, backgroundColor: '#EDF2F7', width: '100%' },
  chartBarsContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 140, paddingHorizontal: 16 },
  barColumn: { alignItems: 'center', width: 44, marginRight: 12 },
  barValue: { fontSize: 10, color: '#718096', marginBottom: 4, height: 14 },
  barBackground: { width: 16, height: 100, backgroundColor: '#EDF2F7', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 12, color: '#4A5568', marginTop: 8 },

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