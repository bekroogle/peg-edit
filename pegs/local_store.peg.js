{
  symbol_table = [];
  
  // Returns index of search key in symbol_table or -1
  lookup = function(key) {
    for (var i = 0; i < symbol_table.length; i++) {
      if (symbol_table[i].name === key) {
        return i;
      }
    }
    return -1;
  };

  // Assigns a value to the .value property associated with the 
  // symbol named by key.
  assign = function(key, value) {
    var index = lookup(key);
    if (index !== -1) {
      symbol_table[index].value = value;
    } else {
      throw("Attempted assignment to undeclared variable: "+ key +".");
    }  
  };

  // Declares a new symbol with the provided name.
  declare = function(key) {
    var index = lookup(key);
    if (index === -1) {
      symbol_table.push({name: key, value: 0});
    } else {
      throw("Multiple declarations of same variable: "+ key +". ");
    }
  };
  
  // traverse the syntax tree:
  traverse = function(ast) {
    if (ast.type === "program") {
      console.log("ast: " + JSON.stringify(ast,null,2));
      var statements = [];
      for (var i = 0; i < ast.children.length; i++) {
        statements.push(traverse(ast.children[i]));
      }
      return JSON.stringify(statements);
    }
    
    if (ast.type === "loop") {
      for (var i = ast.children[0].lexeme; i > 0; i--){
        traverse(ast.children[1]);
        ast.children[0].lexeme--;
      }    
      
    }
    
    
    if (ast.type === "declare") {
      declare(ast.children[1]);
    }
    
    if (ast.token === "assign") {
      assign(ast.children[0], traverse(ast.children[1]));
    }
    
    if (ast.token === "variable") {
      return symbol_table[(lookup(ast.lexeme))].value;
    }
    
    if (ast.token === "number") {
      return ast.lexeme;
    }
    if (ast.token === "oper") {
     switch (ast.lexeme) {
      case "+": return traverse(ast.children[0]) + traverse(ast.children[1]);
      case "*": return traverse(ast.children[0]) * traverse(ast.children[1]);
      case "/": return traverse(ast.children[0]) / traverse(ast.children[1]);
      case "^": return power(traverse(ast.children[0]), traverse(ast.children[1]));
     }
    }
 };
}

start = s:statement* {
  var prog = {
    type: 'program',
    children: s
  };
  console.log(traverse(prog));
  return prog; 
}

statement
  = loop
  / declare 
  / assign

loop
  = lcv:loop_head body:loop_body loop_foot {
    return {
      type: 'loop', 
      children: [
        lcv,
        body
      ] 
    };
  }

loop_head
  = 'loop' ws lcv:expr ws ':' ws { return lcv;}

loop_body = statement*

loop_foot = 'repeat' ws



declare
  = t:typename i:id {
    return {type: 'declare', children: [
      t,
      i
    ]};
  }
assign
  = i:id ap:assignment_predicate {
    return {token: 'assign', children: [
      i,
      ap.expr
    ]};
  }

assignment_predicate
  = as:assign_symbol e:expr {return {op: '=', expr: e};}
typename
  = intT / realT

intT
  = 'int' ws { return text().trim(); }
realT
  = 'real' ws { return text().trim(); }

expr = a:add ws { return a; }

add
  = l:subtract '+' r:add { return {token: 'oper', lexeme: '+', children: [l, r]}; }
  / subtract
 
subtract
  = l:neg r:subtract { return {token: 'oper', lexeme: '+', children: [l, r]}; }
  / neg
 
neg
  = '-' n:mult { return {token: 'oper', lexeme: '*', children: [n, {token: 'number', lexeme: -1}]}; }
  / mult
 
mult 
  = l:div '*' r:mult { return {token: 'oper', lexeme: '*', children: [l, r]}; }
  / div
 
div
  = num:recip denom:div { return {token: 'oper', lexeme: '*', children: [num, denom]}; }
  / recip
 
recip
  = '/' n:number { return {token: 'oper', lexeme: '/', children: [{token: 'number', lexeme: '1'}, n]}; }
  / power
 
power
  = x:parens '^' y:power {return {token: 'oper', lexeme: '^', children: [x, y]}; }
  / parens
 
parens
  = '(' a:add ')' {return a;}
  / value
  
value
  = variable
  / number
 
variable
  = i:id { return {token: "variable", lexeme: i};}
  
number = [0-9]+ { return {token: 'number', lexeme: parseInt(text(),10)}; }

  
assign_symbol = '=' ws
id = [_a-zA-Z][_a-zA-Z0-9]* ws { return text().trim(); }
ws = [ \t\n]* { return '';}
