var FCK = 60
EPSC2=0.002+0.000085*(FCK-50)**0.53
EPSCU=0.0026+0.035*((90-FCK)/100)**4
NN=1.4+23.4*((90-FCK)/100)**4
DDX=EPSC2/1000
var X=0
var X2=0
var X3=0
var X4=0
var XY=0
var X2Y=0
for (var c = 0; c < 1000; c++) {
    Y=1-(1-X/EPSC2)**NN
    X2=X2+X*X
    X3=X3+X*X*X
    X4=X4+X*X*X*X
    XY=XY+X*Y
    X2Y=X2Y+X*X*Y
    X=X+DDX
}
    
A1=(X2Y-X4*XY/X3)/(X3-X2*X4/X3)
A2=-(X2Y-X3*A1)/X4

console.log(A1)
console.log(A2)