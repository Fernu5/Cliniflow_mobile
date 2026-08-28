import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CadastroScreen() {
  const router = useRouter(); 
  const { modoAdm } = useLocalSearchParams(); 

  const [tipoPerfil, setTipoPerfil] = useState<'Paciente' | 'Medico'>('Paciente');

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [crm, setCrm] = useState(''); 
  const [sexo, setSexo] = useState('M'); 
  const [termosAceitos, setTermosAceitos] = useState(false);
  
  const [carregando, setCarregando] = useState(false);

  const handleDataChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    if (valor.length > 4) {
      valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    }
    setDataNascimento(valor);
  };

  const handleCpfChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setCpf(valor);
  };

  const handleCadastro = async () => {
    if (!nome || !sobrenome || !dataNascimento || !cpf || !email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }
    if (!termosAceitos) {
      Alert.alert("Atenção", "Você precisa concordar com os Termos de Uso.");
      return;
    }
    if (tipoPerfil === 'Medico' && !crm) {
      Alert.alert("Atenção", "O CRM é obrigatório para cadastrar um médico.");
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      Alert.alert("Erro", "CPF incompleto ou inválido.");
      return;
    }

    const partesData = dataNascimento.split('/');
    if (partesData.length !== 3) {
      Alert.alert("Erro", "Digite a data no formato DD/MM/AAAA");
      return;
    }
    const dataMySQL = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

    setCarregando(true);

    const IP = '192.168.1.12';

    try {
      const resposta = await fetch(`http://${IP}:3000/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, sobrenome, email, senha, cpf: cpfLimpo, dataNascimento: dataMySQL, sexo, tipoPerfil, crm
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert("Sucesso!", modoAdm === 'true' ? "Usuário cadastrado com sucesso no sistema." : "Sua conta foi criada. Você já pode fazer login.", [
          { text: "OK", onPress: () => modoAdm === 'true' ? router.back() : router.replace('/') }
        ]);
      } else {
        Alert.alert("Erro no Cadastro", dados.erro || "Verifique seus dados e tente novamente.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerContainer}>
          {modoAdm === 'true' && (
            <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#2D3748" />
            </TouchableOpacity>
          )}
          <View style={styles.iconBox}>
            <Text style={styles.iconPlus}>+</Text>
          </View>
          <Text style={styles.title}>Criar Conta</Text>
        </View>

        {modoAdm === 'true' && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, tipoPerfil === 'Paciente' && styles.toggleButtonActive]}
              onPress={() => setTipoPerfil('Paciente')}
            >
              <Text style={[styles.toggleText, tipoPerfil === 'Paciente' && styles.toggleTextActive]}>Paciente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, tipoPerfil === 'Medico' && styles.toggleButtonActive]}
              onPress={() => setTipoPerfil('Medico')}
            >
              <Text style={[styles.toggleText, tipoPerfil === 'Medico' && styles.toggleTextActive]}>Médico</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sobrenome</Text>
            <TextInput style={styles.input} placeholder="Sobrenome" value={sobrenome} onChangeText={setSobrenome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput 
              style={styles.input} 
              placeholder="DD/MM/AAAA" 
              value={dataNascimento} 
              onChangeText={handleDataChange}
              keyboardType="numeric" 
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF (Apenas números)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="123.456.789-00" 
              value={cpf} 
              onChangeText={handleCpfChange}
              keyboardType="numeric" 
              maxLength={14}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input} 
              placeholder="seuemail@email.com" 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Senha" 
              value={senha} 
              onChangeText={setSenha}
              secureTextEntry 
            />
          </View>

          {tipoPerfil === 'Medico' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CRM</Text>
              <TextInput 
                style={styles.input} 
                value={crm} 
                onChangeText={setCrm} 
                placeholder="CRM/BA 12345" 
                autoCapitalize="characters"
              />
            </View>
          )}

          <View style={styles.sexoContainer}>
            <Text style={styles.sexoLabel}>Sexo</Text>
            
            <TouchableOpacity style={styles.radioOption} onPress={() => setSexo('M')}>
              <View style={[styles.radioOuter, sexo === 'M' && styles.radioOuterSelected]}>
                {sexo === 'M' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>M</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioOption} onPress={() => setSexo('F')}>
              <View style={[styles.radioOuter, sexo === 'F' && styles.radioOuterSelected]}>
                {sexo === 'F' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>F</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setTermosAceitos(!termosAceitos)}
          >
            <View style={[styles.checkbox, termosAceitos && styles.checkboxChecked]}>
              {termosAceitos && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termosText}>
              Concordo com os <Text style={styles.linkText}>Termos de Uso</Text> e <Text style={styles.linkText}>Política de Privacidade</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, carregando && { opacity: 0.7 }]} 
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Concluir Cadastro</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={carregando}>
            <Text style={styles.backButtonText}>
              {modoAdm === 'true' ? 'Cancelar e Voltar' : 'Já tenho uma conta. Entrar'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 32, paddingTop: 64, paddingBottom: 80 },
  headerContainer: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  headerBackButton: { position: 'absolute', left: -8, top: 12, padding: 8 }, 
  iconBox: { backgroundColor: '#12A388', width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconPlus: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 4, marginBottom: 24 },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#12A388' },
  toggleText: { fontSize: 14, fontWeight: 'bold', color: '#A0AEC0' },
  toggleTextActive: { color: '#FFFFFF' },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#A0AEC0', marginBottom: 4, marginLeft: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D3748' },
  sexoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  sexoLabel: { fontSize: 16, color: '#718096', marginRight: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  radioOuterSelected: { borderColor: '#12A388' },
  radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#12A388' },
  radioText: { fontSize: 16, color: '#2D3748' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, paddingRight: 16 },
  checkbox: { height: 20, width: 20, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#12A388', borderColor: '#12A388' },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  termosText: { fontSize: 12, color: '#718096', flex: 1 },
  linkText: { color: '#12A388', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#12A388', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  backButton: { alignItems: 'center', marginTop: 24 },
  backButtonText: { color: '#A0AEC0', fontSize: 14 },
});