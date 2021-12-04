import { forEachChild } from "typescript";

const DEFAULT_WIDTH = 10;
const DEFAULT_HEIGHT = 20;

export class Document {
    private spreadsheet : Spreadsheet;

    private static singleton: Document;
    private constructor() {
        this.spreadsheet = new Spreadsheet(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    }

    public static instance(): Document {
        if (this.singleton === undefined) {
            this.singleton = new Document();
        }
        return this.singleton;
    }

    getSpreadsheet() : Spreadsheet {
        return this.spreadsheet;
    }
}

//export class Document {
//    //private spreadsheets : Spreadsheet[]
//    private spreadsheet : Spreadsheet;
//
//    constructor() {
//        this.spreadsheet = new Spreadsheet(10, 20);
//    }
//
//    //newSpreadsheet() : void {
//    //    //Todo
//    //}
//
//    //removeSpreadsheet(index : number) : void {
//    //    //Todo
//    //}
//}

export class Spreadsheet {
    private width : number;
    private height : number;
    private cells : Cell[][];
    
    constructor(width : number, height : number) {
        this.width = width;
        this.height = height;

        this.cells = new Array(width);
        for (let x = 0; x < this.width; x++) {
            this.cells[x] = new Array(height);
            for (let y = 0; y < this.height; y++) {
                this.cells[x][y] = new Cell();
            }
        }
    }

    getCells() : Cell[][] {
        return this.cells;
    }

    getWidth() : number {
        return this.width;
    }

    getHeight() : number {
        return this.height;
    }

    updateCell(x : number, y : number, input : string) : void {
        //let exp = Parser.parse(input);
        this.cells[x][y].updateVal(input);
    }

    export() : void {
        let data = "";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let value = "";
                let cellValue = this.cells[x][y].getValue();
                if (cellValue.getKind() == CellKind.Number) {
                    value += cellValue.getNumber();
                } else {
                    value += cellValue.getString();
                }
                data += value + ",";
            }
            data += "\n";
        }
        console.log(data);
    }

    insertRow(index : number) : void {
        this.height++;
        for (let x = 0; x < this.width; x++) {
            this.cells[x].splice(index, 0, new Cell());
        }
    }

    deleteRow(index : number) : void {
        //Todo
    }

    insertColumn(index : number) : void {
        this.width++;
        let array = [];
        for (let i = 0; i < this.height; i++) {
            array.push(new Cell());
        }
        this.cells.splice(index, 0, array);
    }

    deleteColumn(index : number) : void {
        //Todo
    }
}

export interface IObserver {
    update() : void
}


export abstract class Subject {
    observers : IObserver[]

    constructor() {
        this.observers = new Array();
    }

    notify() : void {
        this.observers.forEach((observer) => {
            observer.update();
        });
    }

    attach(obs : IObserver) : void {
        this.observers.push(obs);
    }
    
    detach(obs : IObserver) : void {
        let index = this.observers.indexOf(obs);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

}

export class Parser {
    public static parse(str : string) : IExpression {
        let pos = -1;
        let ch = '';

        let nextChar = () => {
            ch = ((++pos < str.length) ? str.charAt(pos) : -1) + '';
        }

        let eat = (charToEat : string) => {
            while (ch == ' ') nextChar();
            if (ch == charToEat) {
                nextChar();
                return true;
            }
            return false;
        }

        let parse = () => {
            nextChar();
            let x = parseExpression();
            if (pos < str.length) throw new Error("Unexpected: " + ch);
            return x;
        }

        let parseExpression : any = () => {
            let x = parseTerm();
            for (;;) {
                if      (eat('+')) x += parseTerm(); // addition
                else if (eat('-')) x -= parseTerm(); // subtraction
                else return x;
            }
        }

        let parseTerm = () => {
            let x = parseFactor();
            for (; ;) {
                if (eat('*')) x *= parseFactor(); // multiplication
                else if (eat('/')) x /= parseFactor(); // division
                else return x;
            }
        }

        let parseFactor : any = () => {
            if (eat('+')) return parseFactor(); // unary plus
            if (eat('-')) return -parseFactor(); // unary minus

            let x;
            let startPos = pos;
            if (eat('(')) { // parentheses
                x = parseExpression();
                eat(')');
            } else if ((ch >= '0' && ch <= '9') || ch == '.') { // numbers
                while ((ch >= '0' && ch <= '9') || ch == '.') nextChar();
                x = parseFloat(str.substring(startPos, pos));
                //} else if (ch >= 'a' && ch <= 'z') { // functions
                //    while (ch >= 'a' && ch <= 'z') nextChar();
                //    String func = str.substring(startPos, this.pos);
                //    x = parseFactor();
                //    if (func.equals("sqrt")) x = Math.sqrt(x);
                //    else if (func.equals("sin")) x = Math.sin(Math.toRadians(x));
                //    else if (func.equals("cos")) x = Math.cos(Math.toRadians(x));
                //    else if (func.equals("tan")) x = Math.tan(Math.toRadians(x));
                //    else throw new RuntimeException("Unknown function: " + func);
            } else {
                throw new Error("Unexpected: " + ch);
            }

            if (eat('^')) x = Math.pow(x, parseFactor()); // exponentiation

            return x;
        }

        return parse();
    }

    public static reverse(exp : IExpression) : string {
        //Todo
        throw new Error("Method not implemented.");
    }
}

export class Cell extends Subject implements IObserver {
    private expression : IExpression;
    private cacheValue : ICellValue;
    private rawValue : string;

    constructor() {
        super();
        this.expression = new StringExp("");
        this.cacheValue = new CellString("");
        this.rawValue = "";
    }
    
    update() : void {
        this.cacheValue = this.expression.eval()
        this.notify();
    }

    updateVal(rawValue : string) : void {
        this.rawValue = rawValue;
        this.cacheValue = new CellString(rawValue);
        //this.rawValue = rawValue;
        //this.expression = Parser.parse(rawValue);
        //this.cacheValue = this.expression.eval();
        //this.notify()
    }

    clear() : void { 
        this.updateVal("");
        this.notify();
    }

    getValue() : ICellValue {
        return this.cacheValue; 
    }

    getDisplay() : string {
        if (this.cacheValue.getKind() == CellKind.Number) {
            return this.cacheValue.getNumber() + '';
        } else {
            return this.cacheValue.getString();
        }
    }

    getRawValue() : string {
        return this.rawValue; 
    }
}

export enum CellKind {
    String, 
    Number
}

export interface ICellValue {
    getKind() : CellKind
    getNumber() : number
    getString() : string
}

export class CellString implements ICellValue {
    value : string

    constructor(value : string) {
        this.value = value;
    }

    getKind(): CellKind {
        return CellKind.String;
    }

    getNumber(): number {
        return 0;
    }

    getString(): string {
        return this.value;
    }
}

export class CellNumber implements ICellValue{
    value : number

    constructor(value : number) {
        this.value = value;
    }

    getKind(): CellKind {
        return CellKind.Number;
    }

    getNumber(): number {
        return this.value;
    }

    getString(): string {
        return "";
    } 
}


export enum Operation {
    Add, 
    Mult,
    Sub, 
    Div
}


export interface IExpression  {
   eval() : ICellValue 
}


export class OperationExp implements IExpression {
    left : IExpression
    right : IExpression
    op : Operation

    constructor(left : IExpression, right : IExpression, op : Operation) {
        this.left = left;
        this.right = right;
        this.op = op;
    }

    eval(): ICellValue {
        let value;
        switch (this.op) {
            case Operation.Add:
                value = this.left.eval().getNumber() + this.right.eval().getNumber();
                break;
            case Operation.Sub:
                value = this.left.eval().getNumber() - this.right.eval().getNumber();
                break;
            case Operation.Mult:
                value = this.left.eval().getNumber() * this.right.eval().getNumber();
                break;
            case Operation.Div:
                value = this.left.eval().getNumber() / this.right.eval().getNumber();
                break;
            default:
                throw new Error("Unknown operator " + this.op);

        }
        return new CellNumber(value);
    }
}


export class CellReferenceExp implements IExpression {
    cell : Cell

    constructor(cell : Cell) {
        this.cell = cell;
    }

    eval(): ICellValue {
        return this.cell.getValue();
    }
}

export class NumberExp implements IExpression {
    value : number

    constructor(value : number) {
        this.value = value;
    }

    eval(): ICellValue {
        return new CellNumber(this.value);
    }
}

export enum RangeOperation {
    Sum,
    Avg,
    Max,
    Min
}

export class RangeReferenceExp implements IExpression {
    cells : Cell[]
    op : RangeOperation;

    constructor(cells : Cell[], op : RangeOperation) {
        this.cells = cells;
        this.op = op;

        if (this.cells.length == 0) {
            throw new Error("Empty range reference");
        }
    }

    eval() : ICellValue {

        switch (this.op) {
            case RangeOperation.Avg:
                return this.doAvg();
            case RangeOperation.Sum:
                return this.doSum();
            case RangeOperation.Max:
                return this.doMax();
            case RangeOperation.Min:
                return this.doMin();
        }
    }

    doAvg() : ICellValue {
        let value = 0;
        for (let i = 0; i < this.cells.length; i++) {
            value += this.cells[i].getValue().getNumber();
        }
        value = value / this.cells.length;
        return new CellNumber(value);
    }

    doSum() : ICellValue {
        let value = 0;
        for (let i = 0; i < this.cells.length; i++) {
            value += this.cells[i].getValue().getNumber();
        }
        return new CellNumber(value);
    }

    doMax() : ICellValue {
        let value = this.cells[0].getValue().getNumber();
        for (let i = 0; i < this.cells.length; i++) {
            let next = this.cells[i].getValue().getNumber();
            if (next > value) {
                value = next;
            }
        }
        return new CellNumber(value);
    }

    doMin() : ICellValue {
        let value = this.cells[0].getValue().getNumber();
        for (let i = 0; i < this.cells.length; i++) {
            let next = this.cells[i].getValue().getNumber();
            if (next < value) {
                value = next;
            }
        }
        return new CellNumber(value);
    }
}

//export class APIExp implements IExpression {
//    URL : string
//    parameter : string
//    eval(): ICellValue {
//        //Todo
//        throw new Error("Method not implemented.");
//    }
//}

export class StringExp implements IExpression {
    value : string

    constructor(value : string) {
        this.value = value;
    }

    eval(): ICellValue {
        return new CellString(this.value);
    }
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const BASE_COUNT = CHARSET.length;
export class BaseConvert {
    public static encode(num: number): string {
        let ret = '';

        if (num < 0) {
            return '';
        }

        if (num == 0) {
            return CHARSET[0];
        }

        while (num >= BASE_COUNT) {
            let mod = num % BASE_COUNT;
            ret = CHARSET[mod] + ret;
            num = Math.floor(num / BASE_COUNT);
        }

        if (num > 0) {
            ret = CHARSET[num] + ret;
        }

        return ret;
    }

    public static decode(s: string): number {
        let decoded = 0;
        let multi = 1;
        let rev = s.split('').reverse();

        rev.forEach((char) => {
            decoded += multi * CHARSET.indexOf(char);
            multi = multi * BASE_COUNT;
        });

        return decoded;
    }
}

