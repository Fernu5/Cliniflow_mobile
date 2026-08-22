import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilScreen() {
  const router = useRouter();
  
  const { id } = useLocalSearchParams(); 

  const IP = '192.168.1.12';

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [sexo, setSexo] = useState('');
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (id) {
      const idLimpo = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
      
      fetch(`http://${IP}:3000/perfil/${idLimpo}`)
        .then(res => res.json())
        .then(dados => {
          setNome(dados.nome_usuario);
          setSobrenome(dados.sobrenome_usuario);
          setEmail(dados.email_usuario);
          setDataNascimento(dados.data_nasc);
          setCpf(dados.cpf_usuario);
          setSexo(dados.sexo_usuario === 'Masculino' ? 'M' : 'F');
        })
        .catch(err => console.error("Erro ao carregar perfil", err))
        .finally(() => setCarregando(false));
    }
  }, [id]);

  const handleSalvar = async () => {
    if (!nome || !sobrenome || !email) {
      Alert.alert("Atenção", "Preencha os campos editáveis.");
      return;
    }

    setSalvando(true);
    const idLimpo = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);

    try {
      const resposta = await fetch(`http://${IP}:3000/perfil/${idLimpo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, sobrenome, email })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert(
          "Sucesso",
          "Perfil atualizado com sucesso!",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert("Erro", "Não foi possível salvar as alterações.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Falha ao conectar com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirConta = () => {
    Alert.alert(
      "Atenção: Excluir Conta",
      "Tem certeza que deseja excluir sua conta? Você perderá o acesso ao sistema da clínica.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, excluir", 
          style: "destructive",
          onPress: async () => {
            setCarregando(true);
            const idLimpo = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
            
            try {
              const resposta = await fetch(`http://${IP}:3000/perfil/${idLimpo}/desativar`, {
                method: 'PATCH'
              });

              if (resposta.ok) {
                Alert.alert("Conta Excluída", "Sua conta foi desativada com sucesso.");
                router.replace('/'); 
              } else {
                Alert.alert("Erro", "Não foi possível desativar a conta.");
                setCarregando(false);
              }
            } catch (error) {
              Alert.alert("Erro", "Falha de conexão com o servidor.");
              setCarregando(false);
            }
          }
        }
      ]
    );
  };

  const iniciais = nome && sobrenome ? nome.charAt(0) + sobrenome.charAt(0) : '';

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#12A388" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciais.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sobrenome</Text>
            <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]} 
              value={dataNascimento} 
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]} 
              value={cpf} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sexoContainer}>
            <Text style={styles.sexoLabel}>Sexo</Text>
            
            <View style={styles.radioOption}>
              <View style={[styles.radioOuter, sexo === 'M' ? styles.radioOuterSelectedDisabled : styles.radioOuterDisabled]}>
                {sexo === 'M' && <View style={styles.radioInnerDisabled} />}
              </View>
              <Text style={styles.radioTextDisabled}>M</Text>
            </View>

            <View style={styles.radioOption}>
              <View style={[styles.radioOuter, sexo === 'F' ? styles.radioOuterSelectedDisabled : styles.radioOuterDisabled]}>
                {sexo === 'F' && <View style={styles.radioInnerDisabled} />}
              </View>
              <Text style={styles.radioTextDisabled}>F</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSalvar} disabled={salvando}>
            {salvando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleExcluirConta}>
            <Text style={styles.deleteButtonText}>Excluir Conta</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  scrollContent: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48 },
  
  avatarWrapper: { alignSelf: 'center', marginBottom: 32, position: 'relative' },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#12A388', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E6FFFA', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#12A388', fontSize: 32, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#12A388', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#A0AEC0', marginBottom: 4, marginLeft: 4 },
  
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D3748' },
  
  inputDisabled: { backgroundColor: '#F7FAFC', color: '#A0AEC0', borderColor: '#EDF2F7' },
  
  sexoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  sexoLabel: { fontSize: 16, color: '#718096', marginRight: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  
  radioOuterDisabled: { borderColor: '#E2E8F0', backgroundColor: '#F7FAFC' },
  radioOuterSelectedDisabled: { borderColor: '#A0AEC0', backgroundColor: '#F7FAFC' },
  radioInnerDisabled: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#A0AEC0' },
  radioTextDisabled: { fontSize: 16, color: '#A0AEC0' },

  submitButton: { backgroundColor: '#12A388', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  
  deleteButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FC8181', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' },
});