// ================== ELEMENT ==================
const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const scoreWhiteEl = document.getElementById("scoreWhite");
const scoreBlackEl = document.getElementById("scoreBlack");
const capturedWhiteEl = document.getElementById("capturedWhite");
const capturedBlackEl = document.getElementById("capturedBlack");
const levelText = document.getElementById("currentLevel");
const levelDropdown = document.getElementById("levelDropdown");

// ================== STATE ==================
let turn = "white";
let selected = null;
let validMoves = [];
let enPassant = null;
let level = "Easy";
let scoreWhite = 0;
let scoreBlack = 0;

let values = { p: 2, n: 6, b: 6, r: 10, q: 18 };

const symbols = {
    r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
    R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let board = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
];

let moved = { K:false, k:false, rL:false, rR:false, rl:false, rr:false };

// ================== LOADING ==================
let progress = 0;
const loadingInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    document.getElementById("progress").style.width = progress + "%";

    if (progress >= 100) {
        clearInterval(loadingInterval);
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("gameContent").style.display = "flex";
    }
}, 200);

// ================== LEVEL ==================
levelText.onclick = () => {
    levelDropdown.style.display =
        levelDropdown.style.display === "block" ? "none" : "block";
};

function setLevel(lvl) {
    level = lvl;
    levelText.textContent = lvl + " ▼";
    levelDropdown.style.display = "none";

    if (lvl === "Easy") values = { p:2,n:6,b:6,r:10,q:18 };
    if (lvl === "Medium") values = { p:3,n:6,b:7,r:10,q:20 };
    if (lvl === "Hard") values = { p:4,n:6,b:7,r:12,q:25 };

    const pts = document.querySelectorAll(".piece-points li");
    pts[0].textContent = `♙ Pion : ${values.p} pts`;
    pts[1].textContent = `♘ Kuda : ${values.n} pts`;
    pts[2].textContent = `♗ Gajah : ${values.b} pts`;
    pts[3].textContent = `♖ Benteng : ${values.r} pts`;
    pts[4].textContent = `♕ Ratu : ${values.q} pts`;
}

// ================== HELPER ==================
function own(p) {
    return (turn === "white" && p === p.toUpperCase()) ||
           (turn === "black" && p === p.toLowerCase());
}

function findKing(color) {
    const k = color === "white" ? "K" : "k";
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++)
            if (board[r][c] === k) return { r, c };
}

function isSquareAttacked(r, c, byColor) {
    const enemy = byColor === "white";
    for (let i=0;i<8;i++)
        for (let j=0;j<8;j++) {
            const p = board[i][j];
            if (!p) continue;
            if (enemy && p !== p.toUpperCase()) continue;
            if (!enemy && p !== p.toLowerCase()) continue;
            if (isValid(i,j,r,c,true)) return true;
        }
    return false;
}

function inCheck(color) {
    const king = findKing(color);
    const enemy = color === "white" ? "black" : "white";
    return isSquareAttacked(king.r, king.c, enemy);
}

// ================== MOVE LOGIC ==================
function getMoves(sr, sc) {
    const res = [];
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++)
            if (isValid(sr,sc,r,c,true))
                res.push({ r, c, capture: !!board[r][c] });
    return res;
}

function isValid(sr,sc,tr,tc,test) {
    const p = board[sr][sc];
    const t = board[tr][tc];
    if (t && ((p===p.toUpperCase()) === (t===t.toUpperCase()))) return false;

    const dr = tr-sr, dc = tc-sc;
    const ar = Math.abs(dr), ac = Math.abs(dc);

    if (p.toLowerCase()==="p") {
        const d = p==="P"?-1:1;
        if (dc===0 && !t && dr===d) return true;
        if (dc===0 && !t && dr===2*d && ((sr===6&&p==="P")||(sr===1&&p==="p"))) return true;
        if (ac===1 && dr===d && (t || (enPassant && enPassant.r===tr && enPassant.c===tc))) return true;
        return false;
    }

    if (p.toLowerCase()==="n") return (ar===2&&ac===1)||(ar===1&&ac===2);
    if (p.toLowerCase()==="b") return ar===ac && clear(sr,sc,tr,tc);
    if (p.toLowerCase()==="r") return (sr===tr||sc===tc) && clear(sr,sc,tr,tc);
    if (p.toLowerCase()==="q") return (ar===ac||sr===tr||sc===tc) && clear(sr,sc,tr,tc);

    if (p.toLowerCase()==="k") {
        if (ar<=1 && ac<=1) return true;
        return false;
    }
}

function clear(sr,sc,tr,tc) {
    let r = sr + Math.sign(tr-sr);
    let c = sc + Math.sign(tc-sc);
    while (r!==tr || c!==tc) {
        if (board[r][c]) return false;
        r+=Math.sign(tr-sr);
        c+=Math.sign(tc-sc);
    }
    return true;
}

// ================== RENDER ==================
function renderBoard() {
    boardEl.innerHTML = "";
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++) {
            const sq = document.createElement("div");
            sq.className = `square ${(r+c)%2?"dark":"light"}`;
            if (board[r][c]) {
                sq.textContent = symbols[board[r][c]];
                sq.classList.add(board[r][c]===board[r][c].toUpperCase()?"white":"black");
            }
            if (selected && selected.r===r && selected.c===c)
                sq.classList.add("selected");

            validMoves.forEach(m=>{
                if (m.r===r && m.c===c)
                    sq.classList.add(m.capture?"capture":"move");
            });

            sq.onclick=()=>clickSquare(r,c);
            boardEl.appendChild(sq);
        }
}

// ================== GAME ==================
function clickSquare(r,c) {
    if (!selected) {
        if (board[r][c] && own(board[r][c])) {
            selected={r,c};
            validMoves=getMoves(r,c);
        }
    } else {
        const m = validMoves.find(v=>v.r===r && v.c===c);
        if (m) move(selected.r,selected.c,r,c,m);
        selected=null; validMoves=[];
    }
    renderBoard();
    checkGameEnd();
}

function move(sr,sc,tr,tc) {
    const p = board[sr][sc];
    const t = board[tr][tc];

    if (t) {
        const v = values[t.toLowerCase()]||0;
        if (turn==="white") {
            scoreWhite+=v;
            capturedWhiteEl.textContent+=symbols[t]+" ";
        } else {
            scoreBlack+=v;
            capturedBlackEl.textContent+=symbols[t]+" ";
        }
    }

    board[tr][tc]=p;
    board[sr][sc]="";

    scoreWhiteEl.textContent=scoreWhite+" pts";
    scoreBlackEl.textContent=scoreBlack+" pts";

    turn = turn==="white"?"black":"white";
    turnText.textContent = turn==="white"?"Putih":"Hitam";
}

// ================== END GAME ==================
function hasMove(color) {
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++)
            if (board[r][c] && own(board[r][c]))
                if (getMoves(r,c).length) return true;
    return false;
}

function checkGameEnd() {
    if (inCheck(turn) && !hasMove(turn))
        showCheckmate(turn==="white"?"Hitam":"Putih");
}

function showCheckmate(winner) {
    document.getElementById("winnerText").textContent="Pemenang: "+winner;
    document.getElementById("checkmateOverlay").style.display="flex";
    boardEl.style.pointerEvents="none";
}

function resetGame() {
    location.reload();
}

function toggleRules() {
    const el=document.getElementById("rulesContent");
    el.style.display=el.style.display==="none"?"block":"none";
}

// ================== INIT ==================
renderBoard();
