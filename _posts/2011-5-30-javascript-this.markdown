---
layout: post
title: "JavaScriptの&quot;this&quot;をめぐる冒険"
---

+ 大変長いです。
+ 実践的な事は書いてありません。
+ 推測を元に多くが書かれており、誤った解釈が存在する可能性があります。

いつも通り、誤りがあれば指摘して下さると嬉しいです。


#thisの仕様を読もう！

JavaScriptの"this"の難しさは、「thisが書かれているオブジェクトを指すだろう」という素朴な解釈とは異なる原理で動作する点にあると思います。

結論を言えば、「ある関数が、obj.method();という形で特定のオブジェクトのプロパティとして呼び出されたとき、関数内部のthisはその親オブジェクトを指す」事が分かれば実用上問題ないと思うのですが、個人的にすっきりしないので、その原理を徹底的に解析しよう！仕様書を読もう！　というのが今回の記事の主旨です。

#thisは何と定義されているか。

まずは定義から。以降は断りのない限り、全て5thの仕様です。また、文中の引用文章は読みやすさを考慮して適宜改行、強調を行っています。

参考：　[ECMAScript 5th 仕様書](http://www.ecma-international.org/publications/standards/Ecma-262.htm)

> ECMA-262 5th  

> *11.1.1 The this Keyword*
> The this keyword evaluates to the value of the ThisBinding of the current execution context.

「thisは現在のexecution contextのthis/ThisBindingの値を返す」という事でしょうか。これだけじゃなんとも言えませんが、

+ execution contextと呼ばれる何かがある。
+ execution contextは、currentという言葉から分かるように、移り変わるものである。
+ execution contextには、thisの値を決定するようなパラメータがある。

という事は分かりました。では、execution contextは何と定義されているのか。

#execution contextを理解しないと始まらない

> *10.3 Execution Contexts* 
> When control is transferred to ECMAScript executable code, control is entering an execution context. 
> > コントロールがexecutable codeに移るとき、コントロールはexecution contextに入る。 
> Active execution contexts logically form a stack. The top execution context on this logical stack is the running execution context. 
> > アクティブなexecution contextsは、論理的なスタックである。この論理的スタックの一番上にあるexecution contextsが、実行中のexecution contextsである。 
> A new execution context is created whenever control is transferred from the executable code associated with the currently running execution context to executable code that is not associated with that execution context. 
> > 現在実行中のexecution contextに結び付けられたexecutable codeから、（実行中の）execution contextに結び付けられていないexecution codeにコントロールが移るときに、新しいexecution contextが作られる。 
> The newly created execution context is pushed onto the stack and becomes the running execution context. 
> > 新しく作られたexecution contextはスタックにpushされ、それが実行中のexecution contextとなる。 
 
なるほど。少し強引に解釈すると、

+ JavaScriptエンジンがコードを実行し始めたときに、同時にexecutable contextが作成される。
+ コードは全てが連続しているわけではなく、何らかの基準で分けられている。そして、そのコードが切り替わるたびにexecutable contextも新しくなる。
+ しかし、コードの切り替えは、前のコードを捨てるような形では行われない。本を上に積んでいくように貯められ、一番上に積まれているものから処理されていくる。

ということでしょうか。5thはこの後より詳しく論じているので、もう少し続けてみます。

#execution contextが、thisの値を決めるパラメータを持っている。
> An execution context contains whatever state is necessary to track the execution progress of its associated code. In addition, each execution context has the state components listed in Table 19.
> > execution contextには、それに結び付けられたコードが実行の経過を追うために必要な状態のすべてが含まれている。加えて、個々のexecution contextは以下の状態を保持している。
> 
> *Table 19 —Execution Context State Components*
> *LexicalEnvironment* Identifies the Lexical Environment used to resolve identifier references made by code within this execution context.
> ...
> *ThisBinding* The value associated with the this keyword within ECMAScript code associated with this execution context.
> > このexecution contextに結び付けられたECMAScript中のthisの語句に結び付けられる。
> *10.4 Establishing an Execution Context*
> When control enters an execution context, the execution context’s ThisBinding is set...
> > コントロールがexecution contextに入るとき、ThisBindingが設定される。

execution contextが内部的にthisの値を定めるパラメータを持っており、それはexecution contextが立ち上がる時に定められ、かつその内容決定の仕組みはコードの種類によって変わりうるということですね。でも、その仕組みについてはまだ書いてありません。もう少し読み進める必要がありますが、その前に一旦まとめてみます。

+ execution contextとは、コードごとに固有に存在する「説明書」のようなものであり、thisの内容のほか、スコープの情報や変数の情報が記されている。
+ コード中でthisが呼ばれたとき、コードは自分のexecution contextに書かれたthisの指定先を調べる。
+ このパラメータはexecution contextが作られたとき＝コードの実行順序が自分に回ってきたときに決定されるが、その決定方法はコードの種類によって異なるらしい。

なお、execution contextに関しては[こちらの優れた記事と邦訳](http://d.hatena.ne.jp/oogatta/20101003/1286099289)が大変参考になります。そちらを見て頂いた方が、execution contextの理解は早いかと思います。
では次に、具体的なコードの種類と、それぞれのthisの決め方を調べていきます。

#executable codeは３種類ある。
> *10.1 Types of Executable Code*
> There are three types of ECMAScript executable code:
Global code is source text that is treated as an ECMAScript Program. The global code of a particular Program does not include any source text that is parsed as part of a FunctionBody.
> > グローバルコードはECMAScriptプログラムとして扱われる。ある特定のプログラムのグローバルコードは、FunctionBodyと解釈できるソースを含まない。
> Eval code ...

> Function code is source text that is parsed as part of a FunctionBody.
> The function code of a particular FunctionBody does not include any source text that is parsed as part of a nested FunctionBody.
> > 関数コードは、FunctionBodyを成すものと解釈されるソースである。ある特定のFunctionBodyの関数コードは、FunctionBodyを入れ子として含むことはない。
> ...

コードにはGlobal / Eval / Function の３つの種類があります。
ただ、Globalとは定義上「FunctionBodyを含まないコード」であり、Evalはeval関数を使った際の例外的なコードであるということから、最後のFunction codeの理解が重要になるように思われます（Evalの読解は長くなりそうなので、今回は取り上げません）。
ちなみに、Global codeと認定された場合は、
> *10.4.1 Entering Global Code*
> ...
> 
> *10.4.1.1 Initial Global Execution Context*
> The following steps are performed to initialize a global execution context for ECMAScript code C:
> ...
> 3.Set the ThisBinding to the global object.

というように、分かりやすくglobal objectが代入されるようです（ただ、global objectが入れられるパターンは後述するように他にもあります）。
次に、Function codeの定義を見てみます。

#Function codeの場合の、thisを決定する仕組み
> *10.4.3 Entering Function Code*
> The following steps are performed when control enters the execution context for function code contained in function object F, a caller provided thisArg, and a caller provided argumentsList:
>  次の手順は、関数オブジェクトが含むFunction codeのexecution contextにコントロールが写ったときに実行され、呼び出し元はthisArgとargumentsListを渡す。
> 1.If the function code is strict code, set the ThisBinding to thisArg.
>  strictなら（="use strict";使用時）、ThisBindingにthisArgを入れる。
> 2.Else if thisArg is null or undefined, set the ThisBinding to the global object.
> thisArgがnullもしくはundefinedの場合、ThisBindingにはglobal objectを入れる。
> 3.Else if Type(thisArg) is not Object, set the ThisBinding to ToObject(thisArg).
>  thisArgがオブジェクトではないときは、ToObject(thisArg)の値を入れる。
> 4.Else set the ThisBinding to thisArg.
> ...
おさらいですが、thisが直接的に参照するのはexecution context内のThisBindingです。ここにはthisArgをどんな場合にThisBindingに設定するかということしか書いていませんが、thisArgは呼び出し側が提供するものだ、とも書かれています。ということは、呼び出し側のロジックを見てみなければなりません。

#thisを直接決めるのは一体誰か。
では、関数呼び出し時の内部処理について見てみましょう。
> 11.2.3 Function Calls
> The production CallExpression : MemberExpression Arguments is evaluated as follows:
>  "MemberExpression" "Arguments"の形式をとり、全体として"CallExpression"だと解釈できる構文は、次のように評価される。
> 1.Let ref be the result of evaluating MemberExpression.
>  refに、MemberExpressionを評価した結果を入れる。
> ...
> 
> 6.If Type(ref) is Reference, then
> refがReference型である場合、
> a.If IsPropertyReference(ref) is true, then
> refのbase valueがundefinedもしくはEnvironment Record以外なら、
> i.Let thisValue be GetBase(ref).
> base valueの参照を返す。
> b.Else, the base of ref is an Environment Record
> そうでなければ、
> i.Let thisValue be the result of calling the ImplicitThisValue concrete method of GetBase(ref).
> thisの暗黙値=大抵はundefinedをthisValueとする。
> 7.Else, Type(ref) is not Reference.
> refがReference型でなければ、
> a.Let thisValue be undefined.
> thisValueにundefinedを設定する。
> ...
> 上から見ていきましょう。まず、CallExpression : MemberExpression Argumentsとは何なのか。11.2はこのように表記されています。
> 11.2 Left-Hand-Side Expressions
> Syntax
> MemberExpression :
> PrimaryExpression
> FunctionExpression
> MemberExpression [ Expression ]
> MemberExpression.IdentifierName
> new MemberExpression Arguments
> ...
> CallExpression :
> MemberExpression Arguments
> CallExpression Arguments
> CallExpression [ Expression ]
> CallExpression.IdentifierName
> Arguments :
> ( )
> ( ArgumentList )

記法の勉強をしていないので感覚的な解釈ですが、11.2.3の"CallExpression : MemberExpression Arguments"は、CallExpressionの類型の一つを示しているようですね。ただ、CallExpressionのその他の類型は全てCallExpression自身を含んでいるので、最終的には"MebmerExpression + Arguments"の構文に還元されるのだと思います。例えば、
foo(10).bar();
のようなチェーンメソッドがあれば、

<blockquote>
<table border="0">
<tbody>
<tr>
<td>foo(10)</td>
<td>CallExpression</td>
</tr>
<tr>
<td>.bar</td>
<td>.IdentifierName</td>
</tr>
<tr>
<td>()</td>
<td>Arguments</td>
</tr>
</tbody>
</table>
</blockquote>
直接的には上の様になりますが、
<blockquote>
<table border="0">
<tbody>
<tr>
<td>foo</td>
<td>MemberExpression</td>
</tr>
<tr>
<td>(10)</td>
<td>Arguments</td>
</tr>
<tr>
<td>bar</td>
<td>MemberExpression</td>
</tr>
<tr>
<td>()</td>
<td>Arguments</td>
</tr>
</tbody>
</table>
</blockquote>


最終的にはこの形に分解して解釈するということでしょう。詳細は次の章で見ていきます。

話をFunction Callsに戻します。以上から、1.におけるMemberExpressionとは実行演算子()を外した関数名の部分だと言う事が分かります。関数名を評価するということは、
function bar(){};
 var foo = bar;
と処理をすることと（恐らく）同義ですから、refには関数の参照が入ります。
次に、2.で参照refを内部関数GetValueで処理します。GetValueだけで今回の記事と同じぐらいの説明が要りそうなので、立ち入った説明はしません（し、僕もよくわかってません）が、その名のとおり入れられた参照先の具体的な値を返します（8.7.1参照）。

3.は引数関係なので飛ばします。4.で先ほど処理した型を判別し、Objectでなければエラーを返します。関数の参照を持っていない変数に括弧を付けて、あたかも関数であるかのように実行したときの文法エラーを出すためのフィルターと考えるべきでしょう。5.も同様のフィルターと思われます。

さて、6からが重要な部分です。もう一度引用します。
6.If Type(ref) is Reference, then
a.If IsPropertyReference(ref) is true, then
i.Let thisValue be GetBase(ref).
b.Else, the base of ref is an Environment Record
i.Let thisValue be the result of calling the ImplicitThisValue concrete method of GetBase(ref).
7.Else, Type(ref) is not Reference.
a.Let thisValue be undefined.

6と7によれば、
1. Type(ref) が Reference かつ、IsPropertyReference(ref) が真のとき、thisValue は GetBase(ref)の値
2. Type(ref) が Reference かつ、IsPropertyReference(ref) が真でなく、refがEnviroment Recordであるとき、thisValue は GetBase(ref)　InplicitThisValueの値。
3. Type(ref) が Reference ではないとき、thisValue は undefined
という場合分けができます。とうとう核心部分までやって来ましたね。まず、Type(ref)ですが、これは単純にrefの型を返す内部関数です（8を参照）。

refがどのような値を持っているかは、MemberExpressionの形態によって決定されますから、それぞれの場合の仕様書の表記を見てみないといけません。次の項目では、この三類型が、我々がいつも行っている関数呼び出しのどの類型にあたるのかを検討します。
我々はいつも、どんなやり方で関数を呼び出しているか。

{% highlight javascript %}
var obj = {};

(function(){
  obj.method = function(){
    console.log(this); // obj
    function closure (){
      console.log(this); // global
    }
    closure();
  };
  obj.method();
  console.log(this); // global
}());

console.log(this); // global
{% endhighlight %}

//全て non-strict modeの場合。
たぶん、次の３つが主なパターンではないでしょうか。

  スコープチェーン上にある関数名を指定して呼び出す。
  あるオブジェクトのプロパティである関数を、object.method()の形で呼び出す。
  即時関数として呼び出す。

上の例の場合、method直下で呼び出した=2.のパターン以外のthisは、全てglobal(strict modeならundefined)を指します。closure下は新しいexecution contextに移っていますから、そのthisの内容を決定しているのは"closure();"の評価結果です。即時関数の場合も、「内部にFunction codeを含まないcode」として、"(function(){}());"の部分の評価結果のみに、thisの値は依存していると考えられます。

これらの構文を解析してみます。まず、closure直下で呼ぶ場合はどうでしょうか。この場合は、

<blockquote>
<table border="0">
<tbody>
<tr>
<td>closure</td>
<td>MemberExpression : PrimaryExpression : Identifier</td>
</tr>
<tr>
<td> ()</td>
<td>Arguments : ()</td>
</tr>
</tbody>
</table>
</blockquote>
となるのではないかと思います。そしてmethod直下で呼び出す場合は、
<blockquote>
<table border="0">
<tbody>
<tr>
<td>obj</td>
<td>MemberExpression :
PrimaryExpression :
Identifier</td>
<td rowspan="3">MemberExpression :
MemberExpression
.IdentifierName</td>
</tr>
<tr>
<td>.</td>
<td></td>
</tr>
<tr>
<td> method</td>
<td>?</td>
</tr>
<tr>
<td> ()</td>
<td colspan="2">Arguments : ()</td>
</tr>
</tbody>
</table>
</blockquote>
と解釈できるのではないでしょうか。この類型の場合は、類型として仕様上に明記されていることから、Identifierではなく、MemberExpression .IdentifierNameとして解析されると思われます。

最後に即時関数の場合。
<blockquote>
<table border="0">
<tbody>
<tr>
<td>外側の()を含めた全体</td>
<td>PrimaryExpression : ( Expression )</td>
</tr>
<tr>
<td>function(){}</td>
<td>Expression : MemberExpression :
FunctionExpression</td>
</tr>
<tr>
<td>functionの後ろの()</td>
<td>Arguments : ()</td>
</tr>
</tbody>
</table>
</blockquote>


これらを整理すると、

+ スコープチェーン上にある関数名を指定して呼び出すパターン -> Identifier
+ あるオブジェクトのプロパティである関数を、object.method()の形で呼び出す。 -> MemberExpression .IdentifierName
+ 即時関数として呼び出すパターン -> FunctionExpression

をそれぞれ評価した値を調べれば、先の分岐に当てはめることができるはずです。

まずは1.のIdentifierのパターンから見ていきます。

#Identifierを評価すると、何が返ってくるのか。
Identifierを評価するとき、
> 11.1.2 Identifier Reference
> An Identifier is evaluated by performing Identifier Resolution as specified in 10.3.1. The result of evaluating an
Identifier is always a value of type Reference.
>  識別子を評価した結果は、常にReference型である。

というルールが存在します。Reference型とは、
> A Reference is a resolved name binding. A Reference consists of three components, the base value, the referenced name and the Boolean valued strict reference flag. The base value is either undefined, an Object, a Boolean, a String, a Number, or an environment record (10.2.1). A base value of undefined indicates that the reference could not be resolved to a binding. The referenced name is a String.
>  Referenceは名前束縛を解決した結果である。Referenceは base value, referenced name, strict reference flagの3つの要素からなる。base valueはundefined, Object, Boolean, String, Number, enviroment recordのいずれかである。base valueがundefinedの場合、それは参照が束縛を解決できなかった事を意味する。referenced nameはString型である。

とあるように、識別子の名前解決のための型のようです。あるいは特別なラッパーオブジェクトと言ってもいいかも知れません。これによれば、Reference型だがbase valueはObject型ということがあり得ますし、その場合Type(ref)の結果はObjectではなくReferenceになります。

さらに、Identifierの名前解決を行うとき、GetIdentifierReferenceという内部関数が呼ばれます。GetIdentifierReferenceはexecution contextの持つスコープ情報である Lexical Environmentを参照し、再帰的に該当する識別子を探します。
> 10.3.1 Identifier Resolution
> Identifier resolution is the process of determining the binding of an Identifier using the LexicalEnvironment of the running execution context. During execution of ECMAScript code, the syntactic production PrimaryExpression : Identifier is evaluated using the following algorithm:
>  識別子解決は、実行中のexecution contextのLexicalEnvironmentを使用し、識別子束縛を決定するプロセスである。ECMAScriptコード実行中、PrimaryExpression : Identifierにあたる構文上の生成物は次のアルゴリズムによって評価される。
> 1. Let env be the running execution context‘s LexicalEnvironment.
>  実行中のexecution contextのLexicalEnvironmentをenvに入れる。
> ...
> 
> 3. Return the result of calling GetIdentifierReference function passing env, Identifier, and strict as arguments.
> The result of evaluating an identifier is always a value of type Reference with its referenced name component equal to the Identifier String
>  GetIdentifierReferenceにenvを与えた結果を返す。識別子を評価したこの結果は常にReference型であり、そのreferenced nameは識別子の文字列に等しい。

このとき、GetIdentifierReferenceは特定オブジェクトへの参照ではなく、 Environment Recordsをbase valueに入れて返します。
> 10.2.2.1 GetIdentifierReference (lex, name, strict) 
> The abstract operation GetIdentifierReference is called with a Lexical Environment lex, an identifier String 
> name, and a Boolean flag strict. The value of lex may be null. When called, the following steps are performed: 
> 1. If lex is the value null, then 
> a. Return a value of type Reference whose base value is undefined, whose referenced name is name, 
> and whose strict mode flag is strict. 
> 2. Let envRec be lex‘s environment record. 
> 3. Let exists be the result of calling the HasBinding(N) concrete method of envRec passing name as the 
> argument N. 
> 4. If exists is true, then 
> a. Return a value of type Reference whose base value is envRec, whose referenced name is name, and 
> whose strict mode flag is strict. 
> 5. Else 
> a. Let outer be the value of lex’s outer environment reference. 
> b. Return the result of calling GetIdentifierReference passing outer, name, and strict as arguments 

全てを追っていくと頭が痛くなるので、要点だけ見ると、GetIdentifierReferenceは、

  undefinedを返すパターン(1-a)、
  base valueがenvironment recordであるReference型を返すパターン(4-a)、
  再帰的に自分を呼び出すパターン(5-b)

があると分かります。つまり、Identiferを評価した時点で、undefinedかReference型のどちらかが返ってくることが確定し、結果として少なくともFunction Callの分岐6-aには該当しない事が確定します。

そして、6-aに該当しないということは、ThisBindingの値はundefinedかImplicitThisValueのどちらかであることも確定します。ImplicitThisValueは
> 10.2.1.2.6 ImplicitThisValue() 
> Object Environment Records return undefined as their ImplicitThisValue unless their provideThis flag is true. 
> Object Evironment Recordsは、（そのプロパティである）provideThisがtrueで無い限り、「thisの暗黙値」としてundefinedを返す。 
> 1. Let envRec be the object environment record for which the method was invoked. 
> envRecに、そのメソッドを呼び出したenvironment recordを入れる。 
> 2. If the provideThis flag of envRec is true, return the binding object for envRec. 
> envRecのprovideThis がtrueなら、envRecに束縛されたオブジェクトを返す。 
> 3. Otherwise, return undefined 
> そうでなければ、undefinedを返す。 
 
というルールがあり、説明は省きますが、provideThisがtrueとなるのはWithを指定されたとき (( あと、ECMAScript 5thのbindメソッドもこれを使うのかも？ )) ぐらいらしいので、実用上の殆どの場合はundefinedが返ってくることになります。

まとめてみましょう。

  関数は関数宣言か、関数式を変数に代入する形で定義されるが、どちらも識別子を使って呼び出される。
  識別子を使って呼び出された場合、識別子を評価した結果はReference型である。 ((加えて、Identifierは常にGetIdenrifierReferenceを通して返されるということは、IdentifierのReference-&gt;base valueの値は常にenvironment record型という事になるはずです。))
  Reference型の場合、Thisの暗黙値はundefinedに設定される。 ((strict modeならundefined、そうでなければglobal objectを返すことになりますが、暗黙値にはそもそもundefiendが設定されていることから、「ECMAScript 5thのstrict modeでは、関数の識別子のみで関数を呼び出した場合にはundefinedを返す」というのは特別な処理ではなく、むしろ特別な例外処理を省いた結果だったということが分かります。（もっとも、strict modeが完全に実装されているブラウザは2011/7/12現在ではまだ少ないようで、Firefox 5ぐらいでしか確認できません）。))
  With文等の特殊な場合を除いて、暗黙値は変更されない。
  だから、この場合のthisはglobalもしくはundefinedになる。

やっと一つ答えが出ました。続いて2.のパターンを見てみます。
MemberExpression .IdentifierNameを評価すると何が返ってくるのか。
MemberExpression .IdentifierNameの類型は、直接仕様に記載されていません。しかし、
> The dot notation is explained by the following syntactic conversion: 
> MemberExpression . IdentifierName 
> is identical in its behaviour to MemberExpression [  &lt;identifier-name-string  ] 
> ... 
> ドット表記は、次のようば構文的変換によって説明される。 
> "MemberExpression . IdentifierName"は、”MemberExpression [  &lt;identifier-name-string  ]"と全く同等にふるまう。 
 
という事から、次のルールが適用されます。 
The prod> uction MemberExpression : MemberExpression [ Expression ] is evaluated as follows: 
> 1. Let baseReference be the result of evaluating MemberExpression. 
> baseReferenceに、MemberExpressionを評価した値を入れる。 
> 2. Let baseValue be GetValue(baseReference). 
> baseValueに、GetValue(baseReference)の戻り値を入れる。 
> ... 
> 8. Return a value of type Reference whose base value is baseValue and whose referenced name is 
> propertyNameString, and whose strict mode flag is strict. 
> base valueにbaseValueを入れたReference型の値を返す。  

GetValue自体も大変ややこしいロジックなのですが、結局ははいくつかの例外処理を除き、参照先の値を返すだけだと思われます。そうすると、関数呼び出しという前提を置くなら、MemberExpression [ Expression ]を評価した場合はbase valueにある関数オブジェクトへの参照を持つReference型が返ってくることになります。

この場合、IsPropertyReference(type Object) === true となり、Function Callにおける分岐の6-aに該当し、ThisBindingにはMemberExpression [ Expression ]のMemberExpression部分、すなわちobj.method();ならobjへの参照が代入される事になります。

まとめます。

  obj.method();という関数の呼び出し方は、obj["method"]()とする場合と、構文解釈上は全く同じに扱われる。
  この場合、objへの参照がそのままThisBindingに代入され、thisはobjを指すことになる。
  "obj"自体はIdentifierであるが、Identifierを評価した値そのものがThisBindingに代入されない点が、前項の場合と異なる。

即時関数を評価すると何が返ってくるのか。
即時関数、つまり

{% highlight javascript %}
(function(){}());
{% endhighlight %}

この慣用表現の構文をもう一度掲載すると、

<blockquote>
<table border="0">
<tbody>
<tr>
<td>外側の()</td>
<td>PrimaryExpression : ( Expression )</td>
</tr>
<tr>
<td>function(){}</td>
<td>MemberExpression : FunctionExpression</td>
</tr>
<tr>
<td>functionの後ろの()</td>
<td>Arguments : ()</td>
</tr>
</tbody>
</table>
</blockquote>
これは先の二類型と違ってIdentifierが関係しません。( Expression )を評価すると、自動的にExpressionを評価する事になるだけ(11.1.6参照)なので、FunctionExpressionの評価のみが問題となります。
FunctionExpression : function ( FormalParameterListopt ) { FunctionBody }
is evaluated as follows:
...

13.2 Creating Function Objects
...
1. Create a new native ECMAScript object and let F be that object.

...

20. Return F.
FunctionExpressionを評価すると、以上のルールに従い、Object型の値が戻ってくるようです。つまりReference型+base valueがObject型という事ではなく、単なるObject型になると思われます。この解釈が正しければ、7.に該当し、undefinedがThisBindingに代入されます。その後は前項と一緒です。

まとめます。

  即時関数の外側の括弧は、関数呼び出しについて言えば、中身の評価に影響を及ぼさない。
  FunctionExpressionを評価すると、直接Object型の値が返ってくる。
  Object型の値が返ってきた場合、Function Callの過程はThisBindingにundefinedを代入する。
  だから、即時関数の直下ではthisはundefinedもしくはglobalになる。

簡単な総括
以下のルールで、大体の説明ができると思います。
11.2.3 Function Calls
The production CallExpression : MemberExpression Arguments is evaluated as follows:
"MemberExpression" "Arguments"の形式をとり、全体として"CallExpression"だと解釈できる構文は、次のように評価される。
1.Let ref be the result of evaluating MemberExpression.
 refに、MemberExpressionを評価した結果を入れる。
...

6.If Type(ref) is Reference, then
refがReference型である場合、
a.If IsPropertyReference(ref) is true, then
refのbase valueがundefinedもしくはEnvironment Record以外なら、
i.Let thisValue be GetBase(ref).
base valueの参照を返す。
b.Else, the base of ref is an Environment Record
そうでなければ、
i.Let thisValue be the result of calling the ImplicitThisValue concrete method of GetBase(ref).
thisの暗黙値=大抵はundefinedをthisValueとする。
7.Else, Type(ref) is not Reference.
refがReference型でなければ、
a.Let thisValue be undefined.
thisValueにundefinedを設定する。
...

  Identifierを評価すると、base valueにEnvironment Recordsが入ったReference型が返ってくる。
   MemberExpression : MemberExpression [ Expression ] を評価すると、base valueにMemberExpressionへの参照が入ったReference型が返ってくる。
  FunctionExpressionを評価すると、Object型（そのFunctionへの参照）が返ってくる。
