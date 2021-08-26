var op = 1 // Deixei pq aparentemente será fácil implementar as duas coisas
var gamac = 1.4 //                                                                                                                                  GC
var gamas = 1.15 //                                                                                                                                 GS
var nver = 11 //número de vértices da seção                                                                                                         NP
var xp = [0, 85, 85, 0, 0, 30, 30, 55, 55, 30, 0] //                                                                                                XP   
var yp = [0, 0, 85, 85, 0, 30, 55, 55, 30, 30, 0] //                                                                                                YP
// número de tipos de concreto não nos interessa também (1)                                                                                         NRC**
// número de vértices do tipo de concreto, não nos interessa também (11)                                                                            IL**
var fck = 9 // kN/cm²                                                                                                                               FCD
var nbar = 20 // número de barras de aço                                                                                                            NB
var es = 21000 // Módulo de elasticidade do aço                                                                                                     E
// agora entra-se com posição bas barras (x, y), fyk, e porcentagem (1/nbar)
var xbar = [5, 20, 35, 50, 65, 80, 5, 5, 5, 5, 5, 80, 80, 80, 80, 80, 20, 35, 50, 65] //                                                            XB
var ybar = [5, 5, 5, 5, 5, 5, 20, 35, 50, 65, 80, 20, 35, 50, 65, 80, 80, 80, 80, 80] //                                                            YB
var fyk = 50 // aqui não precisa usar array                                                                                                         FYD
var ro = 0.05 // aqui também não                                                                                                                    PERC
var nad = -200 //                                                                                                                                   NA
var maxd = -50000 //                                                                                                                                MAX
var mayd = 50000 //                                                                                                                                 MAY

fcd = fck / gamac
fyd = fyk / gamas
cons = 210000 / es
fck = fcd * gamac * cons
// Cálculo dos parâmetros da tensão no concreto em compressão
if (fck <= 50) {
    epsc2 = 0.002
    epscu = 0.0035
    a1 = 1000                       // tabela 2.2
    a2 = 250000                     // tabela 2.2
} else {
    epsc2 = 0.002 + 0.000085 * (fck - 50) ** 0.53
    epscu = 0.0026 + 0.035 * ((90 - fck) / 100) ** 4
    nn = 1.4 + 23.4 * ((90 - fck) / 100) ** 4 // expoente fig 2.6
    ddx = epsc2 / 1000                      // divisor para integração numérica
    var x = 0
    var x2 = 0
    var x3 = 0
    var x4 = 0
    var xy = 0
    var x2y = 0
    for (c = 0; c < 1000; c++) {
        y = 1 - (1 - x / epsc2) ** nn
        x2 += x * x
        x3 += x * x * x
        x4 += x * x * x * x
        xy += x * y
        x2y += x * x * y
        x += ddx
    }
    a1 = (x2y - x4 * xy / x3) / (x3 - x2 * x4 / x3) 
    a2 = -(x2y - x3 * a1) / x4                      
}
// Teorema de Green para o cálculo das propriedades geométricas da seçao
var xmax = -100000000000
var ymax = -100000000000
var xmin = 100000000000
var ymin = 100000000000

for (c = 0; c < nver; c++) {
    if (xp[c] > xmax) {
        xmax = xp[c]
    }
    if (xp[c] < xmin) {
        xmin = xp[c]
    }
    if (yp[c] > ymax) {
        ymax = yp[c]
    }
    if (yp[c] < ymin) {
        ymin = yp[c]
    }
}
lx = xmax - xmin
ly = ymax - ymin
np1 = nver - 1
var area = 0
var sx = 0
var sy = 0
var jx = 0
var jy = 0
var jxy = 0
for (c = 0; c < np1; c++) {
    dx = xp[c + 1] - xp[c]
    dy = yp[c + 1] - yp[c]
    area += (xp[c] + dx / 2) * dy
    sx += (xp[c] * (yp[c] + dy / 2) + dx * (yp[c] / 2 + dy / 3)) * dy 
    sy += (xp[c] * (xp[c] + dx) + dx * dx / 3) * dy / 2
    jx += (xp[c] * (yp[c] * (dy + yp[c]) + dy * dy / 3) + dx * (yp[c] * (yp[c] / 2 + dy / 1.5) + dy * dy / 4)) * dy
    jy += (dx ** 3/4 + xp[c] * (dx * dx + xp[c] * (1.5 * dx + xp[c]))) * dy / 3
    jxy += (xp[c] * (xp[c] * (yp[c] + dy /2) + dx * (yp[c] + dy / 1.5)) + dx * dx * (yp[c] / 3 + dy / 4)) * dy / 2
}
xg = sy / area
yg = sx / area
sox = sx - yg * area
soy = sy - xg * area
jox = jx - area * yg * yg
joy = jy - area * xg * xg
joxy = jxy - xg * yg * area

// O cálculo das propriedades geométricas está correto!!
// Ajuste das posições em relação ao centroide
for (c = 0; c < nver; c++) {
    xp[c] += - xg
    yp[c] += - yg
}
for (c = 0; c < nbar; c++) {
    xbar[c] += - xg
    ybar[c] += - yg
}
// VOU DEIXAR A FUNÇÃO AJUSTL DENTRO DA ROTINA PRINCIPAL
// ####### CHAMA A FUNCÃO AJUSTA LINHA NEUTRA (AJUSTL) #######
function ajustl() {
    var pi = 3.141592
    var pi2 = 1.570796
    var graus = 57.295779
    var tolmin = 1
    var tole = 0.00000001
    bas = maxd * maxd + mayd * mayd + nad * nad
    var lam = 1
    var alfa0 = 0
    if (jox == joy && Math.abs(joxy) > 0.00001) {
        alfa0 = pi2
    } else {
        if (jox != joy) {
            alfa0 = Math.atan(- 2 * joxy / (jox - joy)) / 2
        }
    }
    cao = Math.cos(alfa0)
    sao = Math.sin(alfa0)
    cao = cao * cao 
    sao = sao * sao 
    ss = joxy * Math.sin(2 * alfa0) 
    pjx = jox * cao + joy * sao - ss 
    pjy = joy * cao + jox * sao + ss 
    alph = 0 
    if (maxd == 0) {
        if (mayd >= 0) {
            alph = - pi2
        } else {
            alph = pi2
        }
    } else {
        alph = Math.atan(mayd * pjx / (maxd * pjy))
        if (maxd > 0) {
            alph += pi
        }
    }
    alfa0 += alph 
    uu = 0.5 
    uu = (pi + uu) ** 5   //////// Linha 151 PONTO DE RETORNO GO TO (Inferno da porra) ######## 300
    uu += -Math.floor(uu) 
    k0 = 0 
    x = (lx + ly) * uu 
    if (OP == 1) { 
        as1 = Math.abs(maxd) / (0.4 * ly * fyd) 
        as2 = Math.abs(mayd) / (0.4 * lx * fyd) 
        if (nad > 0) {
            as3 = nad / fyd
        } else {
            as3 = Math.max(0, (nad - fcd * area) / fyd)
        }
        ast = as1 + as2 + as3
    }
    alph = alfa0
    // Chamar rotina esfor ########################################################################## 890
    dp[0] = maxd - lam * mrx 
    dp[1] = mayd - lam * mry 
    dp[2] = nad - lam * nr 
    tol = Math.sqrt((dp[0] ** 2 + dp[1] ** 2 + dp[2] ** 2) / bas) 
    if (tol <= tole) {
        // Encerra o programa e imprime os resultados FIM
    }
    k = k + 1
    k0 = k0 +1
    if (k0 <= 50) { //Critério de parada
        // Vai para o fim desta etapa GO TO 301 ###################################################
    }
    if (tol < tolmin) {
        tolmin = tol 
        mrxmin = mrx 
        mrymin = mry
        nrmin = nr  
        asmin = ast
        epssmin = epssmin
        epsimin = epsimin
        alphmin = alpha
        lammin = lam
    }
    // Volta para a linha 300 ############################################################
    ca = Math.cos(alph) // Linha 301 ##########################################    301
    sa = Math.sin(alph)
    rt[0,0] = lam * (r[0,0] * ca - r[1,0] * sa) 
    rt[0,1] = lam * (- mry)
    rt[1,0] = lam * (r[0,0] * sa - r[1,0] * ca) 
    rt[1,1] = lam * mrx
    rt[2,0] = lam * r[2,0]
    rt[2,1] = 0 
    if (op == 2) {
        rt[0,2] = mrx
        rt[1,2] = mry
        rt[2,2] = nr
    } else {
        rt[0,2] = r[0,1] * ca - r[1,1] * sa 
        rt[1,2] = r[0,1] * sa + r[1,1] * ca  
        rt[2,2] = r[2,1]
    }
    // Chamar função pivo()
    if (iver == 1) {// vai para a linha 300
    }
    x += dp[0] 
    if (op == 2) {
        lam += dp[2]
    } else {
        as1 = ast + dp[2]
        ast = as1
    }
    alph += dp[1]
    if (Math.abs(alph) > 2 * pi) {
        // ALPH=SIGN(MOD(ALPH,2*PI),ALPH) #################################### 
    }
    if (k < 10000) {
        // vai para linha 890 ########################
    } else {
        // escrever que não convergiu
    }
    mrx = mrxmin
    mry = mrymin
    nr = nrmin
    ast = asmin
    epss = epssmin
    epsi = epsimin
    alph = alphmin
    lam = lammin
    // imprime os resultados ###################################################################
}

function pivo() {
    var iver = 0
    for (j1 = 1; j1 <= 6; j1++) {
        jj = 3 * j1
        i = ii[jj - 2]
        j = ii[jj - 1]
        k = ii[jj]
        if (a[i,i] == 0) {
            iver = 1
        } else {
            aux1 = a[j,i] / a[i,i]
            aux2 = a[k,i] / a[i,i]
            dum1 = a[k,k] - a[i,k] * aux2
            dum2 = a[k,j] - a[i,j] * aux2
            dum3 = b[k] - b[i] * aux2
            aux2 = a[j,j] - a[i,j] * aux1
            if (aux2 == 0) {
                iver = 1
            } else {
                dum4 = (b[j] - b[i] * aux1) / aux2
                dum5 = (a[j,k] - a[i,k] * aux1) / aux2
                aux1 = dum1 - dum2 * dum5
                if (aux1 == 0) {
                    iver = 1
                } else {
                    b[k] = (dum3 - dum2 * dum4) / aux1
                    b[j] = dum4 - dum5 * b[3]
                    b[i] = (b[i] - b[j] * a[i,j] - b[k] * a[I,k]) / a[i,i]
                }
            } 
        }

    }
}

function esfor() {
    ca = Math.cos(alfa)
    sa = Math.sin(alfa)
    tetsc = 0
    tetic = 0
    for (j1 = 1; j1 <= nver; j1++) {
        ksp[j1] = xp[j1] * ca + yp[j1] * sa 
        etp[j1] = - xp[j1] * sa + yp[j1] * ca 
        if (etp[j1] > tetsc) {
            tetsc = etp[j1]
            tkssc = ksp[j1]
        }
        if (etp[j1] < tetic) {
            tetic = etp[j1]
            tksic = ksp[j1]
        }
    }
    tetsa = 0
    tetia = 0
    for (j1 = 1; j1 <= nbar; j1++) {
        ksb[j1] = xb[j1] * ca + yb[j1] * sa 
        etb[j1] = - xb[j1] * sa + yb[j1] * ca 
        if (etb[j1] > tetsa) {
            tetsa = etb[j1]
            tkssa = ksb[j1]
        }
        if (etb[j1] < tetia) {
            tetia = etb[j1]
            tksia = ksb[j1]
        }
    }
    h = tetsc - tetic
    dd = tetsc - tetia
    x23 = epscu / (0.01 + epscu) * dd
    if (x < x23) {
        b = - 0.01 / (dd - x)
        c = b * (x - tetsc)
        blx = -0.01 / (dd - x) ** 2 
        clx = (dd - tetsc) * blx 
        epsi = 0.01 
        epss = -0.01 * x / (dd - x) 
    } else if (x < h) {
        b = - epscu / x 
        c = - epscu - b * tetsc 
        blx = epscu / x ** 2 
        clx = - tetsc * blx 
        epss = - epscu 
        epsi = Math.max(epscu * (dd - x) / x, 0)
    } else if (x > 10 ** 140){
        b = 0
		c = - epsc2
        blx = 10 ** -100
        clx = 10 ** -100
        epss = - epsc2
        epsi = - epsc2
    } else {
        b = - epsc2 / (x - (epscu - epsc2) / epscu * h)
        c = b * (x - tetsc)
        blx = epsc2 / (x - (epscu - epsc2) / epscu * h) ** 2
        clx = (tetsc - (epscu - epsc2) / epscu * h) * blx
        epss = - epsc2 * x / (x - (epscu - epsc2) / epscu * h)
        epsi = - epsc2 * (x - h) / (x - (epscu - epsc2) / epscu * h)
    }
    for (j1 = 1; j1 <= nver; j1++) {
        epsb[j1] = b * etp[j1] + c
    }
    nrzt = 0 
    mrks = 0 
    mret = 0 
    for (j1 = 1; j1 <= 3; j1++) {
        for (j2 = 1; j2 <= 2; j2++) {
            r[j1,j2] = 0
        }
    }
    for (j1 = 1; j1 <= nbar; j1++) {
        epsb = b * etb[j1] + c 
        // chamar função aco (E,EPSB,FYD(J1),SIG,ET)  ##############################
        dum1 = perc[j1] * ast * et * (blx * etab[j1] + clx) 
        dum2 = perc[j1] * sig 
        nrzti = ast * dum2 
        nrzt += nrzti
        mrks += nrzti * etb[j1] 
        mret += - nrzti * ksb[j1]
        r[1,1] += dum1 * etb[j1]
        r[1,2] += dum2 * etb[j1]
        r[2,1] += - dum1 * ksb[j1]
        r[2,2] += - dum2 * ksb[j1]
        r[3,1] += dum1
        r[3,2] += dum2
    }
    if (Math.abs(epss - epsi) <= 10 ** -10) {
        if (epss >= 0) {
            nrz = nrzt
            mrx = mrks * ca - mret * sa
            mry = mrks * sa + mret * ca
        }
        // CHAMAR ROTINA CENTRA ##########################################
    } else {
        if (epss >= 0 && epsi >= 0) {
            nrz = nrzt
            mrx = mrks * ca - mret * sa
            mry = mrks * sa + mret * ca
        } else {
            et01 = - c / b
            et12 = (epsc2 - c) / b
            eps0 = epsp[j2] // Daqui para baixo é bem provável que tenha erros graves
            eps1 = epsp[j2 - 1]
            if (eps0 == eps1) {
                nrz = nrzt
                mrx = mrks * ca - mret * sa
                mry = mrks * sa + mret * ca
            }
            else if (eps0 >= 0 && eps1 >= 0) {
                nrz = nrzt
                mrx = mrks * ca - mret * sa
                mry = mrks * sa + mret * ca
            } else {
                // CHAMAR FUNÇÃO DIFER #######################################
                // CHAMAR FUNÇÃO REGI ########################################
                // CHAMAR FUNÇÃO REGII #######################################
            }
            
        }
            
    }

    nrz = nrzt
    mrx = mrks * ca - mret * sa
    mry = mrks * sa + mret * ca
}

function centra() {
    if (epss >= 0) {

    }
    if (epss < - epsc2) {
        for (c = np1; np1 <= np2; c++) {
            c2 = c + 1
            // chamar função regii() REGIÃO II
        }
    } else {
        for (c = np1; np1 <= np2; c++) {
            c2 = c + 1
            // chamar função regi() REGIÃO I
        }
        for (c = np1; np1 <= np2; c++) {
            c2 = c + 1
            // chamar função regii() REGIÃO II
        }
    }
    // return esforços???
}

function regi() {
    if (ks1 == 0 && et1 == 0 && ks2 == 0 && et2 == 0) {

    } else {
        ble = 2 * a2 * b
        cle = 2 * a2 * c + a1
        d0 = c * a1 + a2 * c * c
        d1 = b * cle
        d2 = a2 * b * b
        e0 = cle * clx
        e1 = ble * clx + cle * blx
        e2 = ble * blx
        br = 0.85 * fcd
        dks = ks2 - ks1
        det = et2 - et1
        det1 = det / 2
        det2 = det * det
        det3 = det2 * det
        dks2 = dks * dks
        g00 = (ks1 + dks / 2) * det
        g01 = (ks1 * (et1 + det1) + dks * (et1 / 2 + det / 3)) * det
        g02 = (ks1 * (et1 * (det + et1) + det2 / 3) + dks * (et1 * (et1 / 2 + det / 1.5) + det2 / 4)) * det 
        g03 = (ks1 * (et1 * (det2 + et1 * (1.5 * det + et1)) + det3 / 4) + dks * (et1 * (0.75 * det2 + et1 * (det + et1 / 2)) + det3 / 5)) * det 
        g10 = (ks1 * (ks1 + dks) + dks2 / 3) * det1 
        g11 = (ks1 * (ks1 * (et1 + det1) + dks * (et1 + det / 1.5)) + dks2 * (et1 / 3 + det / 4)) * det1 
        g12 = (ks1 * (ks1 * (et1 * (et1 + det) + det2 / 3) + dks * (et1 * (et1 + det / 0.75) + det2 / 2)) + dks2 * (et1 * (et1 / 3 + det1) + det2 / 5)) * det1 
        // Verificar (equações 4.8 e 4.10)
        nrzt += br * (d0 * g00 + d1 * g01 + d2 * g02) 
        mrks += br * (d0 * g01 + d1 * g02 + d2 * g03) 
        mret += - br * (d0 * g10 + d1 * g11 + d2 * g12) 
        r[0,0] += br * (e0 * g01 + e1 * g02 + e2 * g03) 
        r[1,0] += - br * (e0 * g10 + e1 * g11 + e2 * g12) 
        r[2,0] += br * (e0 * g00 + e1 * g01 + e2 * g02) 
    }
    // return esforços e acho que a var 'r'
} 

function regii() {
    if (ks1 == 0 && et1 == 0 && ks2 == 0 && et2 == 0) {

    } else {
        dks = ks2 - ks1
        det = et2 - et1
        g00 = (ks1 + dks / 2) * det
        g01 = (ks1 * (et1 + det / 2) + dks * (et1 / 2 + det / 3)) * det
        g10 = (ks1 * (ks1 + dks) + dks * dks / 3) * det / 2
        fc = 0.85 * fcd
        // Verificar (equações 4.9)
        nrzt += - fc * g00
        mrks += - fc * g01
        mret += fc * g10
    }
    // return esforços
}

function aco() { 
    eps2 = fyd / es
    if (Math.abs(epsb) <= eps2) {
        sig = es * epsb
        et = es
    } else {
        if (epsb >= 0) {
            sig = fyd
            et = 0
        } else {
            sig = - fyd
            et = 0
        }
    }
}


function difer() {
    t01 = 0 
    t12 = 0 
    ks1i = 0 
    et1i = 0 
    ks2i = 0 
    et2i = 0 
    ks1ii = 0 
    et1ii = 0 
    ks2ii = 0 
    et2ii = 0 
    i2 = i + 1 
    det = etp[i2] - etp[i] 
    dksdet = (ksp[i2] - ksp[i]) / det 
    dum1 = et01 - etp[i] 
    dum2 = et12 - etp[i] 
    ks01 = ksp[i] + dum1 * dksdet 
    ks12 = ksp[i] + dum2 * dksdet 
    det01 = dum1 / det 
    det12 = dum2 / det
    if (det01 > 0 && det01 < 1) { t01 = 1}
    if (det12 > 0 && det12 < 1) { t12 = 1}
    if (eps0 < eps1) {
        t01 = - t01
        t12 = - t12
    }
    if (t01 == 0 && t12 == 0) {
        if (eps0 < 0) {
            if (eps0 > - epsc2) {
                ks1i = ksp[i]
                et1i = etp[i]
                ks2i = ksp[i2]
                et2i = etp[i2]                                   
            } else {
                ks1ii = ksp[i]
                et1ii = etp[i]
                ks2ii = ksp[i2]
                et2ii = etp[i2]                    
            }
        }
    } else {
        if (t01 == 0) {
            ks1i = ks01
            et1i = et01
            if (t12 == 1) {
                ks2i = ks12
                et2i = et12
                ks1ii = ks12
                et1ii = et12
                ks2ii = ksp[i2]
                et2ii = etp[i2]
            } else {
                ks2i = ksp[i2]
                et2i = etp[i2]
            }
        } else {
            if (t01 == - 1) {
                ks2i = ks01
                et2i = et01                
                if (t12 == - 1) {
                    ks1i = ks12
                    et1i = et12
                    ks2ii = ks12
                    et2ii = et12
                    ks1ii = ksp[i]
                    et1ii = etp[i]
                } else {
                    ks1ii = ksp[i]
                    et1ii = etp[i]
                }
            } else {
                if (t12 == 1) {
                    ks1i = ksp[i]
                    et1i = etp[i]
                    ks2i = ks12
                    et2i = et12
                    ks1ii = ks12
                    et1ii = et12
                    ks2ii = ksp[i2]
                    et2ii = etp[i2]
                } else {
                    ks1i = ks12 
                    et1i = et12 
                    ks2i = ksp[i2] 
                    et2i = etp[i2] 
                    ks1ii = ksp[i] 
                    et1ii = etp[i] 
                    ks2ii = ks12 
                    et2ii = et12 
                }
            }
        }
    }
}
