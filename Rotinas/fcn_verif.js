// Flexo-Compressão Normal: Verificação
// Seções retangulares com várias camadas de armadura

// Inserir function função
function funcao(w, qsi) {
    // Calcula o valor da função f(qsi) dada na equação (3.2.1)
    // do Volume 3 de Curso de Concreto Armado
    // w é a taxa mecânica de armadura
    // qsi=x/h é a profundidade relativa da linha neutra
    // rc é a resultante de compressão do concreto adimensional dada na equação (2.4.4)
    // bc é a posição da resultante adimensional dada na equação (2.4.5)
    // soma1 é o somatório que aparece na equação (3.2.1)
    // soma2 é o somatatório que aparece na equação (3.2.2)
    // f é o resultado da equação (3.2.1)
    
    ql = eu * beta[0] / (eu + 10)
    if (qsi <= ql) {
        // A linha neutra está no domínio 2
        c = 0.01 / (beta[0] - qsi)
    } else if (qsi <= 1) {
        // A linha neutra está nos domínios 3,4 e 4a
        c = eu / (1000 * qsi)
    } else {
        //  A linha neutra está no domínio 5
        c = (e0 / 1000) / (qsi - akapa)
    }
    // Resultante de compressão no concreto
    if (qsi < 1 / alamb) {
        rc = alamb * qsi
        bc = 0.5 * alamb * qsi
    } else {
        rc = 1
        bc = 0.5
    }
    soma1 = 0
    soma2 = 0
    for (i = 0; i < nl; i++) {
        esi = c * (qsi - beta[i])
        tsl = tensao(esi)
        tsi = tsl
        soma1 = soma1 + ni[i] * tsi
        soma2 = soma2 + ni[i] * beta[i] * tsi
    }
    // Funcao f(qsi)
    f = ani - rc - w * soma1 / (n * fyd)
    return [f, rc, bc, soma1, soma2]
}

// Inserir function tensão
function tensao(esl) {
    // Calcula a tensao no aço
    // es = módulo de elasticidade do aço em kN/cm2
    // esl = deformação de entrada
    // fyd = tensão de escoamento de cálculo em kN/cm2
    // tsl = tensão de saída em kN/cm2
    // Trabalhando com deformação positiva
    ess = Math.abs(esl)
    eyd = fyd / es
    if (ess < eyd) {
        tsl = es * ess
    } else {
        tsl = fyd
    }
    // Trocando o sinal se necessário
    if (esl < 0) {
        tsl = -tsl
    }
    return tsl
}

// ENTRADA DE DADOS
fck = 90
fyk = 500
es = 200
gamac = 1.4
gamas = 1.15
b = 20
h = 40
dl = 4
aas = 16
nl = 4
ni = [2, 2, 2, 2]
aand = 560

// INÍCIO DOS CÁLCULOS

// Parâmetros do diagrama retangular
if (fck <= 50) {
    alamb = 0.8
    alfac = 0.85
    eu = 3.5
    e0 = 2.
} else {
    alamb = 0.8 - (fck - 50) / 400
    alfac = 0.85 * (1 - (fck - 50) / 200)
    eu = 2.6 + 35 * ((90 - fck) / 100) ** 4
    e0 = 2 + 0.085 * ((fck - 50) ** 0.53)
}
// Parâmetro kapa que define o ponto com deformação igual a eo no domínio 5
akapa = 1 - e0 / eu
// Conversão de unidades: transformando para kN e cm
fck = fck / 10
fyk = fyk / 10
es = 100 * es
// Resistências de cálculo
fcd = fck / gamac
tcd = alfac * fcd
fyd = fyk / gamas
// Cálculo do número total de barras na seção
n = 0
for (i = 0; i < nl; i++) {
    n += ni[i]
}
// Parâmetro geométrico
delta = dl / h
// Área da seção de concreto
ac = b * h
// Taxa mecânica de armadura
w = aas * fyd / (ac * tcd)
// Esforço normal reduzido
ani = aand / (ac * tcd)
// Esforço normal máximo que a seção resiste em compressão simples
esi = e0 / 1000
tsl = tensao(esi)
tsd0 = tsl
animax = 1 + w * tsd0 / fyd
// Verificação
if (ani > animax) {
    console.log('A seção não suporta o esforço normal dado.')
} else {
// Montagem do vetor beta
// Ver equação (2.2.5) do Volume 3 de Curso de Concreto Armado
// Aqui a primeira camada tem índice zero
// A equação foi modificada para compatibilizar
beta = []
for (i = 0; i < nl; i++) {
    beta[i] = delta + (nl - 1 - i) * (1 - 2 * delta) / (nl - 1)
}
// Processo iterativo da bissecante
// Determinação do intervalo solução
// Valor inicial para a linha neutra adminesional qsi=x/h
qi = 0
// Chamar sub-rotina para calcular o valor da função fi=f(qi)
func = funcao(w, qi)
f = func[0]
fi = f

// Valor final para a linha neutra adimensional qsi=x/h
qf = 1000
// Chamar sub-rotina para calcular o valor da função ff=f(qf)
func = funcao(w, qf)
f = func[0]
ff = f
prod = fi * ff
// Modificando os extremos do intervalo solução até que prod<=0
while (prod > 0) {
    qi = qf
    fi = ff
    qf = 10 * qf
    f, rc, bc, soma1, soma2 = funcao(w, qf)
    ff = f
    prod = fi * ff
}
// O intervalo solução foi definido
// A linha neutra qsi fica entre [qi,qf]

// Processo iterativo da bissecante
fk = 1
while (Math.abs(fk) > 0.001) {
    qk = (qi * ff - qf * fi) / (ff - fi)
    func = funcao(w, qk)
    f = func[0]
    fk = f
    prod = fk * fi
    if (prod >= 0) {
        qi = qk
        fi = fk
    }else {
        qf = qk
        ff = fk
    }
}
// Convergência alcançada
// qk é a raiz da função f(qsi) dada na equação (3.2.1) do Volume 3 de Curso de Concreto Armado
// Cálculo do momento fletor reduzido conforme a equação (3.2.2) do Volume 3
ami = 0.5 * ani - rc * bc - w * soma2 / (n * fyd)
// Momento fletor dimensional
amud = ami * ac * h * tcd
// Passagem para kNm
amud = amud / 100
// Mostrando o resultado
console.log(`O momento de ruína é ${amud.toFixed(2)} kN.m.`)
}