import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

 const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha seu e-mail e senha para continuar.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch('http://192.168.1.12:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        if (dados.isAdmin) {
          router.replace({ pathname: '/(adm)/home-adm', params: { id: dados.id } });
        } else if (dados.perfil === 'Medico') {
          router.replace({ pathname: '/(medico)/home-medico', params: { id: dados.id } });
        } else if (dados.perfil === 'Paciente') {
          router.replace({ pathname: '/(paciente)/home', params: { id: dados.id, nome: dados.nome } }); 
        } else {
          Alert.alert('Erro', 'Perfil de usuário não identificado no sistema.');
        }
      } else {
        Alert.alert('Falha no Login', dados.erro);
      }
    } catch (error) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconPlus}>+</Text>
          </View>
          <Text style={styles.logoText}>Clini<Text style={styles.logoTextBold}>Flow</Text></Text>
          <Text style={styles.slogan}>Sua saúde fluindo.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="email@email.com"
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

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Esqueci Minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, carregando && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não tem uma conta? </Text>
          <Link href="/cadastro" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconBox: {
    backgroundColor: '#12A388',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconPlus: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 32,
    color: '#2D3748',
  },
  logoTextBold: {
    fontWeight: 'bold',
    color: '#12A388',
  },
  slogan: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginVertical: 16,
  },
  forgotPasswordText: {
    color: '#12A388',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#12A388',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  registerLink: {
    color: '#12A388',
    fontSize: 14,
    fontWeight: 'bold',
  },
});