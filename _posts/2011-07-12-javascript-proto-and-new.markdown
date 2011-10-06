---
layout: post
style: text
title: "prototypeはプロトタイプではないし、newを付けなくてもコンストラクタは動く。"
---

 オライリーの「JavaScriptパターン」を読んで考えたことの記録。断定口調ですが、正しさの保障はありません。

#prototypeはただのオブジェクトで、コンストラクタはただの関数。

{% highlight javascript %}
function Obj() {}
Obj.prototype.prop = function() {
  alert();
}

var inst = new Obj;
{% endhighlight %}

こういうやり方をすれば、プロトタイプベースのJavaScriptにおいてもクラス／インスタンス的な機能を実現できると本には書いてある。しかし、prototypeもnewを付ける対象となるコンストラクタ関数も、内部的に特別な機能を与えられたものではない。確かに特別な働きをすることには違いないが、それは全てnewの働きである。コンストラクタとしてのfunctionは普通の関数宣言／式であり、


{% highlight javascript %}
var inst = new Obj;
alert( inst.prototype );
// methodの表示を期待するが、結果はundefined
{% endhighlight %}

またprototypeはプロトタイプオブジェクトではない。

#prototypeはオブジェクトの原型ではなく、プロトタイプオブジェクトの原型のようなもの。

Objがnewを付けて呼ばれるときに、コンストラクタはObj.prototypeを探す。そして、Obj.prototypeが参照するオブジェクトをObjのプロトタイプとしてコピーする。プロトタイプオブジェクトそのものを示すのは \_\_proto\_\_ であり、ECMAScriptの仕様上は内部プロパティである。ただ、ブラウザ側の独自実装として大抵は\_\_proto\_\_としてアクセスできる。だから、

{% highlight javascript %}
function Obj() {}
Obj.prototype.method = function() {
  alert();
}

var inst = new Obj;
Obj.prototype === inst.\_\_proto\_\_ // true
Obj.prototype = null; // インスタンス生成後にprototypeを初期化しても、
inst.method(); // インスタンスに影響はない。
{% endhighlight %}

である。

#「newを付けることで、関数がコンストラクタ化する」わけではない。

正確には、「newを付けなくても、コンストラクタとしての機能の一部は果たせる」

{% highlight javascript %}
function Obj() {}
Obj.prototype.prop = 1;

var inst = Obj(); // new をはずす。
alert(inst.prop); // error
{% endhighlight %}

これは動かない。しかし、


{% highlight javascript %}
function Obj() {
  var that = {};
  for ( prop in Obj.prototype ) { // 内容をコピーする
    that[prop] = Obj.prototype[prop];
  }
  return that;
}
Obj.prototype.prop = 1;

var inst = Obj(); // new をはずす。
alert(inst.prop); // 1
{% endhighlight %}

これは動く。このコードの「プロパティを複製する」という機能に限れば、コンストラクタ内の5行がnewの役割を代替している事になる。やっていることは、

+ thatオブジェクトを作成し、
+ Obj.prototypeの内容をthatへコピーし、 (本来はディープコピーを行うロジックにすべきだが、今回は一階層しかないので簡易的なロジックにしている。 )
+ thatを戻り値として返す。

だけである。inst = Obj() = Obj.prototypeのコピーなのだから、inst.propに1が代入されているのは当然。また、

{% highlight javascript %}
var inst2 = Obj();// もう一つ作る。
inst.prop = 2; // 一方のプロパティを変更する。
alert(inst.prop, inst2.prop); // 2 1
{% endhighlight %}

インスタンス同士も独立する。プロトタイプオブジェクトは定義できないが、オブジェクトの原型作成装置としての最低限の機能は果たしている。

#newはどんな仕事をしているのか。
newは、元から特別なthisにもう少し特別な意味を与えるだけ。


{% highlight javascript %}
function Obj() {
  this.prop = 1;
}
Obj.prototype.method = function(){
  alert(this.prop);
}

var inst= new Obj;
inst.method() // 1
{% endhighlight %}

inst.method()として呼び出されたとき、thisはinstを指す。このthisは、先のthatの時のように、prototypeの参照を明示的に代入されていないし、returnで返されているわけでもない。しかし、実際にmethod内のthisは、Obj.prototype + コンストラクタ内で定義されるプロパティを指している。これは、少なくとも

{% highlight javascript %}
function Obj() {
  Obj.prototypeを継承してthisを作る。
  this.prop = 1;
  return this
}
{% endhighlight %}

という処理が行われている事を意味する。つまり、newを付けることで、

+ prototypeプロパティを探し、見つかれば、thisのプロトタイプオブジェクトとしてコピーする。
+ return文で他の何かが返されていなければ、thisを暗黙に返す。

という作業が行われる。thisは再定義できず、またexecution contextという特別な内部プロパティ (execution contextには、さらにThisBindingというオブジェクトへの参照を保持するプロパティがある。ThisBindingの他には、スコープ情報を持つLexicalEnvironmentと変数情報を持つVariableEnviromentが存在する。つまり、スコープチェーンとthisの参照先は別々に管理されており、だからこそプロトタイプ定義関数内で使うthisとコンストラクタ内で使うthisが同じオブジェクトを指す、ということが可能になる。) を示すので、一般的な「スコープチェーン」の範疇には収まらない。従って、

+ コンストラクタ内で定義したthisのプロパティを、別の所で共有できる。
+ そのthisに対して、プロトタイプを設定する。

という点で、newを使うことは、先に挙げたthatで代用する方法では実現できない機能を持つ。

#まとめ

+ prototypeはプロトタイプオブジェクトそのものではなく、コンストラクタがプロトタイプオブジェクトを作るときに参照する原型である。
+ プロトタイプオブジェクトの参照を持つのは、一般的には\_\_proto\_\_である。
+ prototypeは、newを付けて呼ばれたコンストラクタが暗黙にプロトタイプオブジェクトの原型として参照するという一点において、ただのオブジェクトと区別される。
+ コンストラクタは、newを付けて呼ぶことでthisとプロトタイプに関する暗黙の処理を行う。
+ thisはユーザ側で再定義できないし、newを付けなければプロトタイプオブジェクトは作成されないが、それ以外の点ではnewをつけようが付けまいがコンストラクタはただの関数。

      
    
  
  