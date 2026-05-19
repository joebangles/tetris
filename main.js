
Array.prototype.randomItem = function() {
    return this[Math.floor(Math.random() * this.length)]
}

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

class Manager {
    constructor() {
        let table = document.getElementById("board")


        this.speedModes = {"slow":80,"medium":40,"fast":20}
        let defaults = {"clockwise":"ArrowUp","counter":"KeyZ","left":"ArrowLeft","right":"ArrowRight","down":"ArrowDown","hard":"Space", "pause":"KeyP"}

        this.binds = {}
        for(let b of ["clockwise","counter","left","right","down","hard", "pause"]){
            if(localStorage.getItem(b) == null){
                document.getElementById(b + "-value").innerHTML = defaults[b]
                this.binds[b] = defaults[b]
                localStorage.setItem(b, this.binds[b])
            }
            else{
                document.getElementById(b + "-value").innerHTML = localStorage.getItem(b)
                this.binds[b] = localStorage.getItem(b)
            }
        }


        this.outline = "false"
        if(localStorage.getItem("outline") == null){
            localStorage.setItem("outline", "false")
        }
        else{
            this.outline = localStorage.getItem("outline")
            if(this.outline === "true"){
                document.getElementById("outline-value").innerHTML = "on"
            }
            else{
                document.getElementById("outline-value").innerHTML = "off"
            }
        }

        this.downMode = ["medium", "fast", "slow"]
        if(localStorage.getItem("speed") == null){
            this.downSpeed = this.speedModes[this.downMode[0]]
            localStorage.setItem("speed", "medium")
        }
        else{
            console.log(localStorage.getItem("speed"))
            while(this.downMode[0] !== localStorage.getItem("speed")){
                this.downMode.push(this.downMode.shift())
            }
            this.downSpeed = this.speedModes[this.downMode[0]]
            document.getElementById("speed-value").innerHTML = this.downMode[0]
        }

        this.listening = false;
        this.whatFor = ""

        this.activeGames = []
        this.startingLevel = 1

        this.downdown = false
        this.downint = false


        for (let r of Array(20).keys()) {
            let row = document.createElement("tr")
            row.id = "row " + r
            table.appendChild(row)
            for (let c of Array(10).keys()) {
                let cell = document.createElement("td")

                cell.id = r + " " + c

                row.appendChild(cell)
            }
        }
        let next = document.getElementById("next-piece")
        for(let r of Array(4).keys()){
            let row = document.createElement("tr")
            row.id = "next row " + r
            next.appendChild(row)
            for(let c of Array(6).keys()){
                let cell = document.createElement("td")
                cell.id = "next " + r + " " + c
                row.appendChild(cell)
            }
        }

        document.addEventListener("keydown", e => {
            for(let game of this.activeGames) {
                if (game !== null) {
                    if (!game.lost) {
                        if(!game.paused) {
                            switch (e.code) {
                                case this.binds.clockwise:
                                    game.move({x: 0, y: 0, r: 1})
                                    game.draw()
                                    break;
                                case this.binds.counter:
                                    game.move({x: 0, y: 0, r: -1})
                                    game.draw()
                                    break;
                                case this.binds.left:
                                    game.move({x: -1, y: 0, r: 0})
                                    game.draw()
                                    break;
                                case this.binds.right:
                                    game.move({x: 1, y: 0, r: 0})
                                    game.draw()
                                    break;
                                case this.binds.hard:
                                    game.drop()
                                    game.draw()
                                    break;
                                case this.binds.down:
                                    if (!this.downdown) {
                                        this.downdown = true
                                        this.downint = setInterval(down, this.downSpeed)
                                        game.draw()
                                    }
                                    break;

                            }
                        }
                        if(e.code === this.binds.pause) {
                            for (let game of this.activeGames) {
                                if (game.paused) {
                                    game.unpause()
                                } else {
                                    game.pause()
                                }
                            }
                        }
                    }

                }
            }
            if(this.listening){
                this.binds[this.whatFor] = e.code
                localStorage.setItem(this.whatFor, e.code)
                document.getElementById(this.whatFor + "-value").innerHTML  = e.code
                this.listening = false
            }
        })

        document.addEventListener("keyup", e => {
            if(e.code === this.binds.down && this.activeGames.length > 0){
                this.downdown = false
                clearInterval(this.downint)
            }
        })


    }

    down(){
        for(let game of this.activeGames) {
            if (!game.lost) {
                game.move({x: 0, y: 1, r: 0})
                game.draw()
            }
        }
    }

    startGame() {
        document.getElementById("menu").classList.add("invis")
        for(let a of ["bg", "lvl", "lines", "score"]){
            document.getElementById(a).classList.remove("invis")
        }
        this.activeGames.push(new Game(this.startingLevel, this))
    }

    clearGame(){
        this.activeGames = []
        for(let r of Array(20).keys()){
            for(let c of Array(10).keys()){
                document.getElementById(r + " " + c).className = ""
            }
        }
        for(let r of Array(4).keys()){
            for(let c of Array(6).keys()){
                document.getElementById("next " + r + " " + c).className = ""
            }
        }
        for(let a of ["bg", "lvl", "lines", "score", "game-info"]){
            document.getElementById(a).classList.add("invis")
        }
        document.getElementById("menu").classList.remove("invis")
    }

}

class Position {
    constructor(map, move){
        this.colorMap = JSON.parse(JSON.stringify(map))
        this.piece = new Piece(move.t)
        this.piece.offset.x = 0

        for(let it of Array(move.r).keys()){
            this.piece.rotate(1, true)
        }
        if(move.h > 0) {
            for (let it of Array(move.h).keys()) {
                this.piece.offset.x++
            }
        }
        else if(move.h < 0){
            for(let it of Array(-move.h).keys()){
                this.piece.offset.x--
            }
        }
        let valid = true
        while(valid){
            for(let r of Array(this.piece.bound.length).keys()){
                for(let c of Array(this.piece.bound.length).keys()){
                    if(this.piece.bound[r][c]) {
                        if(r + this.piece.offset.y + 1 < 20) {
                            if (c + this.piece.offset.x < 0) {
                                continue
                            }
                            if (this.colorMap[r + this.piece.offset.y + 1][c + this.piece.offset.x] !== "0") {
                                valid = false
                                console.log((r + this.piece.offset.x) + " " + (c + this.piece.offset.y + 1))
                            }
                        }
                        else{
                            valid = false
                        }
                    }
                }
            }
            if(valid) {
                this.piece.offset.y++
            }
        }
        for(let r of Array(this.piece.bound.length).keys()){
            for(let c of Array(this.piece.bound.length).keys()){
                if(this.piece.bound[r][c]){
                    this.colorMap[r + this.piece.offset.y][c + this.piece.offset.x] = this.piece.type
                }
            }
        }
    }

    stats(){
        let toReturn = {ag_h: 0,h:0,bpns:0,row_tr:0,col_tr:0,pits:0}
        let lastHeight = 0
        let last_col = []
        for(let c of Array(10).keys()){
            let content = false
            let height = 0;
            let col_contents = []

            let last_val = false
            for(let r of Array(20).keys()){
                let filled
                if(this.colorMap[r][c] !== "0"){
                    toReturn.ag_h++
                    content = true;
                    if(height === 0){
                        height = 20-r
                    }
                    col_contents.push(true)
                    filled = true
                }
                else{
                    col_contents.push(false)
                    if(content){
                        toReturn.h++
                    }
                    filled = false
                }
                if(r>0){
                    if(filled !== last_val){
                        toReturn.col_tr++
                    }
                }
                last_val = filled
            }
            if(c > 0){
                toReturn.bpns += Math.abs(height-lastHeight)
                for(let r of Array(20).keys()){
                    if(col_contents[r] !== last_col[r]){
                        toReturn.row_tr++
                    }
                }
            }
            if(!content){
                toReturn.pits++
            }
            last_col = [...col_contents]
            lastHeight = height
        }
        return toReturn
    }
}

class Game {
    constructor(startlvl, manager) {

        document.getElementById("lvl").innerHTML = "Level: " + startlvl
        document.getElementById("lines").innerHTML = "Lines: 0"
        document.getElementById("score").innerHTML = "Score: 0"

        this.paused = false
        this.lost = false

        this.pieceTotal = 0
        this.lvl = startlvl
        this.lines = 0
        this.ticks = 0
        this.score = 0
        this.pieces = ["i", "l", "j", "o", "s", "z", "t"]

        this.manager = manager

        this.bag = ["i", "l", "j", "o", "s", "z", "t"]
        this.bag = this.bag.concat(this.bag, this.bag)
        shuffleArray(this.bag)

        this.nextbag = ["i", "l", "j", "o", "s", "z", "t"]
        this.nextbag = this.nextbag.concat(this.nextbag, this.nextbag)
        shuffleArray(this.nextbag)

        this.intervals =
            { 1:500,
                2:450,
                3: 400,
                4: 350,
                5: 300,
                6: 250,
                7: 200,
                8: 150,
                9: 100,
                10: 80,
                11: 70,
                12: 60,
                13: 50,
                14: 40,
                15: 30,
                16: 20}

        this.interval = this.intervals[this.lvl]
        this.repeatID = setInterval(tick, this.interval)

        this.blockMap = []
        this.colorMap = []

        for (let r of Array(20).keys()) {
            this.blockMap.push([])
            this.colorMap.push([])

            for (let c of Array(10).keys()) {
                this.blockMap[r].push(false)
                this.colorMap[r].push("0")
            }
        }

        // this.possible = []
        // for(let move of this.getPossible("o")){
        //     let pos = new Position(this.colorMap, move)
        //     this.possible.push(pos.colorMap)
        // }
        // setInterval(e => {this.colorMap = this.possible.shift();console.log(this.colorMap);this.draw()}, 500)


        this.spawn()
    }

    getPossible(type){
        let possibleMoves = []

        // Example piece of same type
        let exPiece = new Piece(type)
        let contentFound = false;

        // For each rotation
        for(let rot of Array(4).keys()){
            let realWidth = 0
            
            // Columns with Content
            let colsWithContent = []

            for(let col of Array(exPiece.bound.length).keys()){
                let content = false
                for(let row of Array(exPiece.bound.length).keys()){
                    // If the piece has a block at that point
                    if(exPiece.bound[row][col]){
                        contentFound = true;
                        realWidth++
                        colsWithContent[col] = true
                        content = true
                        break;
                    }
                }
                if(content === false) {
                    colsWithContent[col] = false
                }
            }

            // Columns with content and real width are just 
            // The actual size of the piece
            let leftHoles = 0
            let rightHoles = 0
            let rightLeft = false
            for(let c of colsWithContent){
                if(!c) {
                    if (!rightLeft) {
                        leftHoles ++
                    }
                    else{
                        rightHoles ++
                    }
                }
                else{
                    rightLeft = true
                }
            }
            // ^^ Figure out if the holes are on the right or left

            console.log(leftHoles + " " + rightHoles)
            console.log(realWidth)

            
            for(let off of Array((11)-realWidth).keys()){
                possibleMoves.push({h:off-leftHoles,t:type,r:rot})
            }
            exPiece.rotate(1, true)
        }
        return possibleMoves
    }

    toString() {
        let toReturn = "\n"
        for (let r of Array(20).keys()) {
            for (let c of Array(10).keys()) {
                switch (this.colorMap[r][c]) {
                    case "0":
                        toReturn += "-"
                        break
                    case "i":
                    case "l":
                    case "j":
                    case "o":
                    case "s":
                    case "z":
                    case "t":
                        toReturn += this.colorMap[r][c]
                        break
                }
            }
            toReturn += "\n"
        }
        return toReturn
    }

    spawn(p = false) {
        if(!p){
            if(this.bag.length > 1){
                p = this.bag.shift()
                this.next = this.bag[0]
            }
            else{
                p = this.bag.shift()
                this.bag = [...this.nextbag]
                this.next = this.bag[0]

                this.nextbag = ["i", "l", "j", "o", "s", "z", "t"]
                this.nextbag = this.nextbag.concat(this.nextbag, this.nextbag)
                shuffleArray(this.nextbag)
            }
        }


        //console.log("spawn " + p)


        this.npiece = new Piece(this.next)
        let off = Math.floor((6-this.npiece.bound.length)/2)
        let yoff = 0
        if(this.next === "o"){
            yoff = 1
        }
        for(let r of Array(4).keys()){
            for(let c of Array(6).keys()){
                document.getElementById("next " + r + " " + c).className = ""
            }
        }
        for(let r of Array(this.npiece.bound.length).keys()){
            for(let c of Array(this.npiece.bound.length).keys()){
                if(this.npiece.bound[r][c]){
                    let cell = document.getElementById("next " + (r + yoff) + " " + (c+off))
                    cell.className = ""
                    cell.classList.add(this.next)
                }
            }
        }


        this.activePiece = new Piece(p)
        let piece = this.activePiece
        if (piece.dim === 3 || piece.dim === 4) {
            piece.offset.x = 3
        } else if (piece.dim === 2) {
            piece.offset.x = 4
        } else {
            console.log("This message should never appear :(")
        }
        let add = 0
        let resetC = 0
        for (let y of Array(piece.bound.length).keys()) {
            if (!piece.bound[y].includes(true)) {
                add++
                resetC++
            } else {
                resetC = 0
            }
        }
        add = add - resetC
        piece.offset.y = -add

        this.draw()
    }

    tick(manager) {
        if (this.ticks > 0 && !manager.downdown) {
            this.move({x:0,y:1,r:0})
            this.draw()
        }

        this.ticks++;
    }

    pause(){
        clearInterval(this.repeatID)
        this.paused = true
        document.getElementById("pause").classList.remove("invis")
    }

    unpause(){
        this.repeatID = setInterval(tick, this.intervals[this.lvl])
        this.paused = false
        document.getElementById("pause").classList.add("invis")
    }

    move(dir){
        let results = []

        let piece = this.activePiece

        let xmove = dir.x
        let ymove = dir.y
        let rmove = dir.r

        let currentSpot = JSON.parse(JSON.stringify(this.colorMap))

        // generate current spot
        for(let y of Array(piece.bound.length).keys()){
            for(let x of Array(piece.bound.length).keys()){
                let ypos = y + piece.offset.y
                let xpos = x + piece.offset.x
                if(ypos < 0){
                    continue
                }
                if(piece.bound[y][x]){
                    currentSpot[ypos][xpos] = piece.type
                }
            }
        }


        let bound = piece.rotate(rmove, false)

        // assigne results for each cell
        for(let y of Array(bound.length).keys()){
            for(let x of Array(bound.length).keys()){
                let ypos = y + piece.offset.y + ymove
                let xpos = x + piece.offset.x + xmove
                if(bound[y][x]){
                    if(xpos > 9 || xpos < 0){
                        results.push("block")
                    }
                    if(ypos > 19){
                        results.push("cement")
                        continue
                    }
                    if(ypos < 0){
                        continue
                    }
                    if(this.colorMap[ypos][xpos] !== "0"){
                        if(xmove === 0 && rmove === 0) {
                            results.push("cement")
                        }
                        else{
                            results.push("block")
                        }
                    }
                    else{
                        results.push("confirm")
                    }
                }
            }
        }

        let result = ""
        for(let r of results){
            if(r === "confirm"){
                result = "confirm"
            }
            else if(r === "block"){
                result = "block"
                break
            }
            else if(r === "cement"){
                result = "cement"
                break
            }
        }

        if(result === "confirm"){
            piece.offset.x += xmove
            piece.offset.y += ymove
            piece.rotate(rmove, true)


        }
        else if(result === "cement"){
            for(let r of Array(bound.length).keys()){
                for(let c of Array(bound.length).keys()){
                    if(bound[r][c]) {
                        this.colorMap[r + piece.offset.y][c + piece.offset.x] = piece.type
                        if(r + piece.offset.y <= 0){
                            this.lost = true
                            clearInterval(this.repeatID)
                            console.log("you lose")
                            document.getElementById("game-info").classList.remove("invis")
                            document.getElementById("end-lvl").innerHTML = "level: " + this.lvl
                            document.getElementById("end-lines").innerHTML = "lines: " + this.lines
                            document.getElementById("end-score").innerHTML = "score: " + this.score
                            return
                        }
                    }
                }
            }
            this.pieceTotal++
            this.spawn()
        }

        this.clearLines()

        document.getElementById("score").innerHTML = "Score: " + this.score
    }

    clearLines(){
        let toRemove = []
        let repl = false
        let rn = 0
        for(let r of this.colorMap){
            let c = 0
            for(let cn of Array(r.length).keys()){
                let cell = r[cn]
                if(cell !=="0"){
                    c++
                }
            }
            if(c === 10){
                toRemove.push(rn)
                this.lines++
                document.getElementById("lines").innerHTML = "Lines: " + this.lines
                if(this.lines % 10 === 0){
                    this.lvl++
                    clearInterval(this.repeatID)
                    console.log(this.intervals[this.lvl])
                    this.repeatID = setInterval(tick, this.intervals[this.lvl])
                    this.interval = this.intervals[this.lvl]
                    console.log(this.lvl)
                    document.getElementById("lvl").innerHTML = "Level: " + this.lvl
                }
                repl = true
            }
            rn++
        }
        for(let r of toRemove){
            this.colorMap.splice(r, 1)
            this.colorMap.unshift(Array(10).fill("0"))
        }

        switch(toRemove.length){
            case 1:
                this.score += 40*this.lvl
                break;
            case 2:
                this.score += 100*this.lvl
                break;
            case 3:
                this.score += 300*this.lvl
                break;
            case 4:
                this.score += 1200*this.lvl
                break;
        }
    }

    drop(){
        let valid = true
        while(valid){
            for(let r of Array(this.activePiece.bound.length).keys()){
                for(let c of Array(this.activePiece.bound.length).keys()){
                    if(this.activePiece.bound[r][c]) {
                        if(r + this.activePiece.offset.y + 1 < 20) {
                            if (c + this.activePiece.offset.x < 0) {
                                continue
                            }
                            if (this.colorMap[r + this.activePiece.offset.y + 1][c + this.activePiece.offset.x] !== "0") {
                                valid = false
                            }
                        }
                        else{
                            valid = false
                        }
                    }
                }
            }
            if(valid) {
                this.activePiece.offset.y++
            }
        }
        for(let r of Array(this.activePiece.bound.length).keys()){
            for(let c of Array(this.activePiece.bound.length).keys()){
                if(this.activePiece.bound[r][c]){
                    if(r + this.activePiece.offset.y<=0){
                        this.lost = true
                        clearInterval(this.repeatID)
                        console.log("you lose")
                        document.getElementById("game-info").classList.remove("invis")
                        document.getElementById("end-lvl").innerHTML = "level: " + this.lvl
                        document.getElementById("end-lines").innerHTML = "lines: " + this.lines
                        document.getElementById("end-score").innerHTML = "score: " + this.score
                        return
                    }
                    this.colorMap[r + this.activePiece.offset.y][c + this.activePiece.offset.x] = this.activePiece.type
                }
            }
        }
        this.pieceTotal++
        console.log(this.pieceTotal)
        this.spawn()
        this.clearLines()
    }

    draw() {
        for (let r of Array(20).keys()) {
            for (let c of Array(10).keys()) {
                let cell = document.getElementById(r + " " + c)
                cell.className = ""
                cell.classList.add(this.colorMap[r][c])

            }
        }
        if(this.activePiece !== undefined) {
            let piece = this.activePiece
            for (let r of Array(piece.bound.length).keys()) {
                for (let c of Array(piece.bound.length).keys()) {
                    if (piece.bound[r][c]) {
                        let ypos = r + piece.offset.y
                        let xpos = c + piece.offset.x
                        if (ypos < 0) {
                            continue
                        }
                        let cell = document.getElementById(ypos + " " + xpos)
                        cell.className = ""
                        cell.classList.add(piece.type)

                    }
                }
            }
        }
        else{
            console.log("ignoring")
        }
        if(this.manager.outline === "true"){
            let b = JSON.parse(JSON.stringify(this.activePiece.bound))
            let off = JSON.parse(JSON.stringify(this.activePiece.offset))
            let valid = true
            while(valid){
                for(let r of Array(b.length).keys()){
                    for(let c of Array(b.length).keys()){
                        if(b[r][c]) {
                            if(r + off.y + 1 < 20) {
                                if (c + off.x < 0) {
                                    continue
                                }
                                if (this.colorMap[r + off.y + 1][c + off.x] !== "0") {
                                    valid = false
                                }
                            }
                            else{
                                valid = false
                            }
                        }
                    }
                }
                if(valid) {
                    off.y++
                }
            }
            for(let r of Array(b.length).keys()){
                for(let c of Array(b.length).keys()){

                    if(b[r][c]){
                        let ypos = r + off.y
                        let xpos = c + off.x
                        if (ypos < 0) {
                            continue
                        }
                        let cell = document.getElementById(ypos + " " + xpos)
                        if(cell.className == "0"){
                            cell.className = ""
                            cell.classList.add(this.activePiece.type)
                            cell.classList.add("preview")
                        }
                    }
                }
            }
        }
    }

}

class Piece {
    constructor(type) {
        this.type = type;
        this.offset = {
            x: 0,
            y: 0
        }
        this.bound = []
        this.dim = null
        if (type === "i") {
            this.dim = 4
        } else if (type === "o") {
            this.dim = 2
        } else if (["s", "z", "l", "j", "t"].includes(type)) {
            this.dim = 3;
        } else {
            return;
        }

        for (let r of Array(this.dim).keys()) {
            this.bound.push([])
            for (let c of Array(this.dim).keys()) {
                this.bound[r].push(false)
            }
        }

        if (type === "i") {
            this.bound[1] = [true, true, true, true]
        } else if (type === "o") {
            this.bound[0] = this.bound[1] = [true, true]
        } else if (type === "s") {
            this.bound[2][0] = this.bound[2][1] = this.bound[1][1] = this.bound[1][2] = true
        } else if (type === "z") {
            this.bound[2][2] = this.bound[2][1] = this.bound[1][1] = this.bound[1][0] = true
        } else if (type === "l") {
            this.bound[1] = [true, true, true]
            this.bound[2][0] = true
        } else if (type === "j") {
            this.bound[1] = [true, true, true]
            this.bound[2][2] = true
        } else if (type === "t") {
            this.bound[1] = [true, true, true]
            this.bound[2][1] = true
        }
    }

    rotate(dir, set) {
        if(dir === 0){
            return this.bound
        }
        let toReturn = JSON.parse(JSON.stringify(this.bound))

        for (let y of Array(this.dim).keys()) {
            for (let x of Array(this.dim).keys()) {
                let dim = this.dim - 1
                if (dir === 1) {
                    toReturn[x][dim - y] = this.bound[y][x]
                } else {
                    toReturn[dim - x][y] = this.bound[y][x]
                }
            }
        }
        if(set) {
            this.bound = toReturn
        }
        else{
            return toReturn
        }
    }

    move(dir) {
        if (dir) {
            this.offset.x++
        } else {
            this.offset.x--
        }
    }

    toString() {
        let toReturn = ""
        for (let r of Array(this.bound.length).keys()) {
            for (let c of Array(this.bound.length).keys()) {
                if (this.bound[r][c]) {
                    toReturn += "o"
                } else {
                    toReturn += "-"
                }
            }
            toReturn += "\n"
        }
        return toReturn
    }
}

console.log("hi")

let manager = new Manager()

function tick() {
    for(let game of manager.activeGames) {
        game.tick(manager)
    }
}
function down(){
    manager.down()
}

function level(inp){
    manager.startingLevel = Math.min(Math.max(manager.startingLevel + inp, 1), 10)
    if(manager.startingLevel === 10){
        document.getElementById("lvl-up").classList.add("gray-out")
        document.getElementById("lvl-up").classList.remove("mover")
    }
    else if(manager.startingLevel === 1){
        document.getElementById("lvl-down").classList.add("gray-out")
        document.getElementById("lvl-down").classList.remove("mover")
    }
    else{
        document.getElementById("lvl-up").classList.remove("gray-out")
        document.getElementById("lvl-down").classList.remove("gray-out")
        document.getElementById("lvl-up").classList.add("mover")
        document.getElementById("lvl-down").classList.add("mover")

    }
    document.getElementById("lvl-select").innerHTML = manager.startingLevel
}

function restart(){
    manager.clearGame()
}

function back(){
    if(manager.whatFor !== ""){
        document.getElementById(manager.whatFor + "-value").innerHTML = manager.binds[manager.whatFor]
    }
    manager.listening = false
    manager.whatFor = ""
    document.getElementById("settings").classList.add("invis")
}

function listen(kb){
    if(manager.listening === true){
        document.getElementById(manager.whatFor + "-value").innerHTML = manager.binds[manager.whatFor]
    }
    manager.listening = true;
    manager.whatFor = kb;
    document.getElementById(kb + "-value").innerHTML = "&lt;enter key&gt;"
}

function outline(){
    switch(localStorage.getItem("outline")){
        case "false":
            localStorage.setItem("outline", "true")
            manager.outline = "true";
            break;
        case "true":
            localStorage.setItem("outline", "false")
            manager.outline = "false"
            break;
    }
    if(manager.outline === "true"){
        document.getElementById("outline-value").innerHTML = "on"
    }
    else{
        document.getElementById("outline-value").innerHTML = "off"
    }
}

function speed(){
    manager.downMode.push(manager.downMode.shift())
    document.getElementById("speed-value").innerHTML = manager.downMode[0]
    manager.downSpeed = manager.speedModes[manager.downMode[0]]
    localStorage.setItem("speed", manager.downMode[0])
}

function settings(){
    document.getElementById("settings").classList.remove("invis")
    console.log("settings")
}
