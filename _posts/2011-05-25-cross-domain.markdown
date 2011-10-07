---
layout: post
style: text
title: "クロスドメイン通信とはなんぞや。CORSとはなんぞや。"
---

2011-10-5 仕様の変更に伴い、大部分を書きなおす。


#経緯

僕は今まで、ブラウザのクロスドメイン通信の制約とは、ホスト等が異なるサーバへのアクセスをブラウザが禁止する事だと思っていました。しかし、Chrome Extensionを開発中にどうもそれでは説明が付かない事があり、クロスドメイン通信に関して基本から学び直す機会があったので、せっかくなのでまとめました。この記事の結論を先に言うと、CORSという標準化されたクロスドメイン通信制約のもとでは、ブラウザは主にレスポンスを検閲する、という事です。

ただし、以下の文章は私が個人的に調べた事をまとめたものであり、正しさの保障はありません。むしろ間違いを見つけたら、指摘して頂けるとありがたいです。

#なぜクロスドメイン通信が制約されるのか

まずは基本から。
ブラウザ上のスクリプトが行うクロスドメイン通信には、ご存知の通り制約があります。でも考えてみれば、あるサーバがドメインの異なる別のサーバ間へリクエストすることは一般的な事、というより、それ自体がインターネットの機能を成している根幹要素であり、基本的にはそれを許可しなければ意味がありません。全体に公開したくない場合にのみ、IPによってあるいは各種認証手続きによってフィルタリングするというスタンスです。
ということは、「ブラウザ上スクリプトのクロスドメイン通信」と称してわざわざサーバ間通信と区別するのは、*ブラウザを用いた通信に各種認証手続きやIPフィルタのみでは対応しきれない特殊なリスクがあるからだ*と言えます。そしてそれは、

+ サーバ間の通信は、クライアントとなる側が自らあるいは信頼した第三者のスクリプトによって、自発的にリクエストする。
+ しかし、ブラウジングはその性質上、閲覧した時点でほぼ自動的にページに埋め込まれたスクリプトも実行される。
+ そのスクリプトは、サーバ側ではなくクライアント側で作動する。
+ つまり、*「他人の作った悪意のあるスクリプトを」「事前の調査なく」「半自動的に」「自らの側で」*実行してしまう可能性がある。

という点だと思われます。
ただ、これらのリスクが存在するからといって、実行前にスクリプトの内容をいちいちユーザに確認させるようでは、利便性が大幅に損なわれブラウジングの意味が無くなります。そこで、半自動的に実行してしまうのはやむを得ないとしながら、それによって生まれるリスクをなるべく抑えるというアプローチを採っています（もちろん、ブラウザやその設定によっては、事前にユーザに確認をさせるでしょう）。それがクロスドメイン通信の制約の必要性だと、私は解釈しました。

#具体的に、どんなリスクが生まれるのか。
この項はちょっと知識と理解に自信がありません。しかし、調べた限りでは「クロスサイトスクリプティング（以下XSS)のバリエーションを増やす」、「DoS攻撃の踏み台に利用される」という2つのリスクが重要なんじゃないかと思います。以下簡単な解説。

##XSS
不特定多数の人間が文字のメッセージを残せる掲示板やCMS等に、文章の代わりにタグを用いたJavaScript等のスクリプトを記述すると、そのサイトがスクリプトとして働く文字列を排除するロジックを持っていなければ、閲覧者のブラウザ上でそのスクリプトが動作し始めることになる。
この事自体はクロスドメイン通信の可否とは無関係に発生するが、それを許可してしまうとXSSをより効果的にしてしまう。具体的には、XSSによってCookie・キーイベント・DOM等から窃取したアカウント情報等を、さらに特定のサーバへ直接送信することが可能になり、XSSの目的をより直接的・効果的に達成する手段を与えることになる。

##DoS攻撃
ページに特定／不特定のサーバへ短期間の連続アクセスをするスクリプトを記述することで、閲覧者にサーバ攻撃の肩代わりをさせることが可能になる。この場合、アクセス元はスクリプトを置いてあるサーバではなくクライアントのIPになるため、攻撃を意図した者には非常に都合がいい（ただ、後述するXHR Level2ではサーバがレスポンスを正常に返し得るため、サーバに負荷を掛けるだけなら何の障害もなくできてしまいますよね。）。

というわけで、これらのリスクを減らすため、ブラウザ上で動作するスクリプトの機能を制限するルールとして「同一生成元ポリシー」"same origin policy" が設けられました。

#同一生成元ポリシーとは？
サイト上のスクリプトが、ドメインに関するリクエスト、プロパティの設定・参照などを行う場合、自分とその対象とで

+ ホスト
+ ポート
+ プロトコル

の全てが一致しない限り、処理を有効にしないというブラウザ上の制約です。このルールはNetscape2.0が独自に実装したことに始まり、その効果が認知され他の主要ブラウザでも採用されるようになりました。W3C等により標準仕様とされているわけではないですが、現在ブラウザとして認知される一般的なものは当然にこのポリシーを採用しています。

そして、W3Cの勧告では["Cross-Origin Resource Sharing"](http://www.w3.org/TR/cors/)（以下CORS)というセクションで、同一生成元ポリシーの趣旨に基づくクロスドメイン通信の具体的な仕様として定められています(ただし、CORSは"non-normative"とされているので、この仕様を実装するかどうかは「W3C準拠」であることとは関係はないはずです)。

#クロスドメイン通信禁止の例外と、XMLHttpRequest
　CORSの話はひとまず置いておくとして、先の同一生成元ポリシーが、「クロスドメイン」性を判断する抽象的な基準でした。しかし、同一生成元ポリシーに形式的に該当しつつも、クロスドメイン通信を直接／間接的に可能にする方法がいくつか存在します。それが次の手段です。

- XMLHttpRequest Level2 / XDomainRequest を使う。
- JSONPを使う。
- プロキシを使う。

1は前者がW3Cが策定中の標準仕様であり、後者はIEの独自機能。どちらも、クロスドメイン通信を行う正規の手段です。リクエスト／レスポンスヘッダを主な基準としたCORSの条件（XDomainRequestはやはり独自基準）をパスした場合にのみ、最終的にユーザがデータへアクセスすることを可能にします。

2は、&lt;script&gt;タグで外部のスクリプトが読み込める事を利用した、クロスドメイン制限回避の例外的手法です。リクエスト先のサーバがJavaScriptの関数をコールバックするコードを返す機構を備えていることが条件です。これについては後でもう少し詳しく述べます。

3は、第三のサーバを中継し直接的にはサーバ間の通信とすることで、同一生成元ポリシーの対象から外れる手法。当然、中継する機能を持ったサーバが必要です。

ここでXMLHttpRequestについてまとめておくと、

+ XMLHttpRequest Level1と同一生成元ポリシーは標準化された仕様ではなく、具体的な実装や細かい条件はブラウザによって異なる。
+ XMLHttpRequest Level2はW3Cの標準仕様である。したがって、必ず実装すべき仕様と、裁量に任される部分が分かれる。
+ XMLHttpRequest Level2は、CORSのルールに従う。これは同一生成元ポリシーと根本的な趣旨を同じくするが、クロスドメイン通信を許可するための条件がより具体的で複雑化している。
+ ブラウザにXMLHttpRequest Level1とLevel2の２つのメソッドが同居するのではなく、Level2に置き換わる。つまり、*Level2に準拠する限り、XMLHttpRequestはCORSのルールに従う。*
+ ただし、XMLHttpRequest Level2とCORS、そしてHTML5は独立したセクションであり、かつ現時点（2011/5)では全てドラフトであり、また前二者は"non-normative"である。

参考:[CORS仕様](http://www.w3.org/TR/cors/#cross-origin-request)

という感じです。つまり、クロスドメイン通信の制約についてはまだ多くがブラウザ側の裁量に任されており、各社のブラウザがどのように対応しているかは、個別に調べるか実験してみるかでしか判断できません。ちなみにW3Cにおける"non-normative"とか["SHOULD"](http://tools.ietf.org/html/rfc2119)などの言葉には厳密な定義があるので、是非読んでみてください。

#CORSの中核、Access-Control-Allow-OriginヘッダとOriginヘッダ

Level2では、クロスドメイン通信は条件付きで許可されます。そしてその条件に合致しているかどうかは、CORSのルールに委ねられているのでした。具体的には、主にリクエストヘッダとレスポンスヘッダによって判断され、（また、クロスドメイン通信が可能かどうかをサーバ側に問い合わせる、"preflight request"という予備的な通信を行う場合も規定されている）。
必ずしもリクエスト時に制限を加えるわけではないようです。

どういう事かというと、Level2の場合は「こちら側の身元をリクエストヘッダで明らかにした上で、とりあえずリクエストしてみる」ということを行います。それに対し、サーバ側はヘッダを見てデータを返さないということもできるが、「どのような場合にデータをユーザまで渡すことを許可するか」というヘッダをデータと一緒に返すこともできます。つまり、*リクエスト自体は禁止せずに、正常に返ってきたレスポンスをブラウザが検閲して、それをユーザに渡すかどうかをヘッダによって決める*ということです。

そのヘッダにはいくつか種類がありますが、「Access-Control-Allow-Origin レスポンスヘッダ」と「Origin リクエストヘッダ」が主要な役割を担うと思われます。これらのヘッダについて、次のようなルールが設けられています。

+ Access-Control-Allow-Origin ヘッダに"*"が含まれるときは、クロスドメイン通信を許可する。
+ Access-Control-Allow-Origin ヘッダが１つもないか、あるいは複数存在するときは不許可。
+ Access-Control-Allow-Origin がOriginヘッダと一致しない場合も不許可。

※credential flag等の条件があるが、ややこしくなる上に核心ではないと思われるので省略。

「許可する」というのは、繰り返しになりますが「リクエストを送らない」ということではなく、ユーザにデータを受け渡さないということです。仕様書では、リクエストが返ってきたときの処理に関して、

> 6.1.5. Cross-Origin Request with Preflight
  
> ...If the response has an HTTP status code of 301, 302, 303, or 307 Apply the cache and network error steps. ... Otherwise Perform a resource sharing check. If it returns fail, apply the cache and network error steps. Otherwise, if it returns pass, terminate this algorithm and set the cross-origin request status to success. Do not actually terminate the request. 

> > ...もし、レスポンスが301、302、303、307のいずれかのHTTPステータスコードならば、the cache and network error stepsを動作させる。そうでなければ、resource sharing checkを行う。もしこの結果が失敗ならthe cache and network error stepsへ進むが、このチェックを通ったのならばアルゴリズムを終了し、cross-origin request statusをsuccessとする。

> 6.1.2. Cross-Origin Request Status 

> Each cross-origin request has an associated cross-origin request status that CORS API specifications that enable an API to make cross-origin requests can hook into. It can take at most two distinct values over the course of a cross-origin request. The values are:

> > cross-origin requestはおのおのcross-origin request statusを持っており、CORS APIの仕様はこれに接続できる。一連のcross-origin requestにおいて、このstatusは最大で２つの異なる値を持ちうる。

> success 

> &nbsp;&nbsp; 
> The resource can be shared. 

> > リソースをシェアする。

> abort error 

> &nbsp;&nbsp;  
> The user aborted the request. 

> > ユーザはリクエストを中止する。

このように書かれており、レスポンスが返ってきた時にresource sharing checkなるものを行い、それを通ればデータをユーザに渡すと読めます。他に例外的な規定が無いとするなら、ブラウザはユーザの要求通りのリクエストを行い、それに対してサーバはレスポンスをしている前提があると言えます。余談ですが、言葉の用法からすると、ユーザにデータを渡すまでの一連の処理を「リクエスト」としているようですね。

#サーバは期待通りレスポンスするが、ブラウザが検閲して見せてくれない事が本当かを、実験して確かめる。

※以下については、Chrome 11, 15 / Firefox 4 / Safari 5 で確認しました。Opera 11とIE9では再現できていません。

本当にそうなのかをちょっと実験してみます。XMLHttpRequestを利用して、あえて不可能なクロスドメインリクエストをしてみるのです。仕様によればリクエスト自体は許可されますから、そのリクエストが正常ならばサーバも正常なレスポンスをし、OSレベルではそれを受け取れるはずです。これをプロトコル監視ツールのFiddlerを使って確認します。

例えば、次のようなTwitterのTLから文字列を検索するAPIへアクセスするスクリプトを実行したとします。

{% highlight javascript %}
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function(){
    if (xhr.readyState === 4) alert(xhr.responseText);
};
xhr.open("GET", "http://search.twitter.com/search.json?q=h_demon", true);
xhr.send();
{% endhighlight %}

本来、この指定したAPIにリクエストすると、'h_demon'の文字列が含まれるつぶやきがJSONの形で返ってきます。このAPIへのリクエストをブラウザ上で試みるのが上のコードですが、これを例えばChrome開発ツールのコンソールで実行すると、

![crossdomain-code](/images/crossdomain-code.png)

ご覧のように、「Origin http://hdemon.github.comは、Access-Control-Allow-Originによって許可されていないよ」と出ます。しかし、プロトコル監視ツールを使ってリクエストとレスポンスを見てみると、

![crossdomain-response](/images/crossdomain-response.png)

このように、リクエストもレスポンスも、ちゃんと期待通りに行われています。ただし、上の画像では省略していますが、レスポンスにはAccess-Control-Allow-Originヘッダがありません。
ということは、仕様に沿って解釈するならば、

- ブラウザはクロスドメインリクエストを制限しなかった。
- サーバのAPIは、Originリクエストヘッダを特に考慮しなかった。そのため、要求通りの内容を返した。
- ただし、サーバにはAccess-Control-Allow-Originを付加する設定も無かった。
- ブラウザはレスポンスにAccess-Control-Allow-Originヘッダが無かったため、ルール（上述したルールの2つめ）に従い、受け取ったデータをユーザに渡さなかった。

ということになります。

#JSONPにもAccess-Control-Allow-Originヘッダが付いてないのに、なぜデータを受け取れるの？

なるほどなるほど。CORSルールの下では、ブラウザの検閲がクロスドメイン通信の制約において大きな役割を担っている事が分かりました。

しかし、一つの疑問が残ります。オンブラウザのスクリプトで別ドメインからデータを取得させるAPIを用意するサーバの場合、Access-Control-Allow-Originヘッダを用意するサーバもあるとは思いますが、まだまだJSONPを利用させる場合が多いと思います。だったら、JSONPを使ったリクエストに対するレスポンスには、Access-Control-Allow-Originヘッダが付いているのか？　付いていないとするならば、*JSONPはクロスドメイン通信制約の例外であるか、あるいはCORSに準じないと解釈できないとつじつまが合いません。*

まずは実験。さっきと同じAPIへ、scriptタグによってリクエストします。コードはこんな感じでしょうか。

{% highlight javascript %}
<script type="text/javascript">
function getTl(json) {
  alert(json);
}
</script>
<script type="application/javascript" 
  src="http://search.twitter.com/search.json?q=h_demon&callback=getTl">
</script>
{% endhighlight %}

これを実行すると、

![jsonp-response](/images/jsonp-response.png)

Access-Control-Allow-Originヘッダは・・・付いていませんね。付いていないけれど、当然ながら期待した正常なレスポンスがあり、かつ我々はそれを受け取れています。これはどういうことなのか。

#制限すべき通信かどうかを、ブラウザはいつどうやって判断してるの？

CORSではなく、[XMLHttpRequest level2の仕様](http://www.w3.org/TR/XMLHttpRequest2/)に以下のような記述があります。

> 4.1. Origin and Base URL 

> Each XMLHttpRequest object has an associated XMLHttpRequest origin and an XMLHttpRequest base URL.

> 3.6.8. The send() method 

> If the XMLHttpRequest origin and the request URL are same origin ...These are the same-origin request steps.

> Otherwise These are the cross-origin request steps. 

ブラウザにはリクエストの性質を"same-origin"と"cross-origin"に分類するプロセスがあるようです。そして、その判断材料となるのが、XMLHttpRequestオブジェクトに結び付けられたoriginとbase URLというパラメータだそうです。ここで"cross-origin request"と認定されると、[CORSに規定されるCross-Origin Requestのプロセス]([http://dvcs.w3.org/hg/cors/raw-file/tip/Overview.html#cross-origin-request)に進みます。

一方、JSONPの要であるscriptタグの部分も読んだのですが、特にクロスドメイン通信に関する制約等は見つけられませんでした。したがって、確証はありませんが次のような事ではないかと思います。

+ 制約の対象となるクロスドメイン通信は、全てCORSのルールに従って検閲される。
+ 制約の対象となるクロスドメイン通信であるか否かは、XMLHttpRequestのsendメソッドが呼ばれた時点での、リクエスト先と自分のドメイン等によって決定される。
+ scriptタグを利用したリクエストは、XMLHttpRequestのクロスドメイン性判定のプロセスには準ぜず、仕様上は特別な制約を設けられていない。

scriptタグに本当に制約がないのかは、あまり自信がありません。調べてみたら見つかるかも知れませんが、CORSは独立したセクションで議論されており、JavaScriptのXMLHttpRequestに限定されない制約の話だと思います。XMLHttpRequestが例として挙げられる事はありますが、XMLHttpRequestのルールについての記述はありません。したがって、scriptタグの制約についてもここには書いていないはずですから。

scriptタグに制約がない以上そこには脆弱性の生まれる余地があり、一般的には[CSRF](http://ja.wikipedia.org/wiki/%E3%82%AF%E3%83%AD%E3%82%B9%E3%82%B5%E3%82%A4%E3%83%88%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%83%95%E3%82%A9%E3%83%BC%E3%82%B8%E3%82%A7%E3%83%AA)に気をつけるべきとされていますが、一般論以上の事を知らないので色々書くことは避けておきます。

#ならば、同一生成元ポリシーとは一体なんだったのか。

scriptタグについては少々消化不良ですが、今回はここで終えます。ところでここまでをまとめると、CORSのルールに従うブラウザであればクロスドメインなリクエスト自体は原則的に行われてしまうし、ヘッダさえ合致すれば受けたレスポンスをユーザが扱う事も可能ということになります。つまりCORSの内で全て完結するわけですが、ならば同一生成元ポリシーとは何だったのか、という疑問が生まれます。

この点を僕は今まで勘違いしていましたが、*同一生成元ポリシーとは、「クロスドメイン通信を制約する」ルールではなく、もっと抽象的で広範囲なドメインに関するルール*のようです。信頼できる[MDNの記述](https://developer.mozilla.org/Ja/Same_origin_policy_for_JavaScript)にはこうあります。

> 同一生成元ポリシーによって、ある生成元から読み込まれた文書やスクリプトが、異なる生成元からの文書のプロパティを取得したり設定したりするのを防ぎます。このポリシーは Netscape Navigator 2.0 までさかのぼります。

リクエストを禁止します、とは書いていない。また、この後に続くポリシー違反に関する例を見ても、あくまで生成元の齟齬を禁止する抽象的ルールであるように思われます。

#まとめ

+ 同一生成元ポリシーは、クロスドメイン通信を禁止するためのルールではなく、もっと広くドメイン関連の操作を制限するルールである。
+ クロスドメイン通信に関しては、CORSという標準化策定中の具体的なルールがある。
+ CORSのもとでは、クロスドメイン通信は許可されうる。
+ ブラウザがクロスドメイン通信を制約する際、基本的にはリクエストではなくレスポンスを検閲する。この時、Access-Control-Allow-Originレスポンスヘッダが主な役割を担う。
+ JSONPについてはCORSでは触れられておらず、事実上ブラウザまかせ？
