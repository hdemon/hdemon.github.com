---
layout: post
style: text
title: "jQueryはイベント操作をどのように行っているのか"
---

#addEventListenerの引数設定…煩わしくないですか？

addEventListenerを使い、さらにそのハンドラが参照する関数へデータを渡したい場合、

+ addEventListenerを実行するコンテキストと、登録される側の関数の両方からアクセスできる変数やオブジェクトにデータを入れておく。
+ 無名関数を作り、その中で目的の関数を引数付きで呼び出す構造にする。

という方法があると思います。そして後者の場合、後でイベントトリガーを削除できるようにするために、その無名関数を何かに代入してからaddEventListenerに入れたりします。…僕はそうするんですが、皆さんはどうですか？　つまり、こういう感じです。

{% highlight javascript %}
var handle = function(){
  func(val);
};
window.addEventListener("mousedown", handle);
// 消すとき 
window.removeEventListener("mousedown", handle);
{% endhighlight %}

でも、文法上の制限はどうしようもないとは言え、目的の大したことなさの割にはコードが技巧的で、あまり美しいとは思えない。さらに、あるオブジェクトに登録された異なるリスナーを「一括で」削除したい場合、

{% highlight javascript %}
window.removeEventListener("mousedown");
{% endhighlight %}

というやり方ができないという点も気になります。それができれば、addEventListenerの中に直接無名関数を書けばいいのに。この引数省略の表記はエラーにはならないはずですが、何も意味を持たない命令です。

さて、世の中には同じように感じてくれる頭のいい人もいるもので、各種ライブラリではもっとシンプルかつ便利にリスナーの付け外しができるメソッドが提供されています。今回はその代表jQueryを題材に、どのような仕組みで簡便さを実現しているのかを解析してみたいと思います。

#jQueryのイベント操作
その前に、まずjQueryのイベント関連の代表的な機能の紹介から。

+ bindメソッドでイベント登録できるが、その際に引数を設定できる。引数は仮引数ではなく、event.dataを介して間接的に渡される。
+ unbindメソッドの第2引数を省略することで、リスナー登録を全て消す事ができる。
+ oneメソッドを使えば、1回限り有効なトリガーを設定できる。

こんな素晴らしい機能があります。これらをどういう風に実現しているかを調べるわけですが、予想を立ててみたいと思います。

+ oneメソッドを実現するには、イベントが発生したことをjQuery自身が認識する必要がある。
+ ということは、jQuery内部のプロキシ的な関数へハンドラを渡し、それを経由させイベント発生を検知して、自分自身でイベントを削除しているのではないか。
+ unbindで全消去できる機能は、ハンドラを配列かなんかに貯めておいて、unbindの時にその配列を走査しremoveEventListenerを実行するのではないか。

#bind / oneの仕組み
さて…どうでしょうか。早速コードを見てみましょう。 コアに検索をかけてみたところ、こういう箇所が見つかりました。bindとoneをイテレータで一括定義というところが、いきなり玄人っぽくてオシャレです。というか、この表記のせいで検索に苦労しました。

{% highlight javascript %}
// jquery-1.6.1.js line 3395-
jQuery.each(["bind", "one"], function( i, name ) {
  // A
  jQuery.fn[ name ] = function( type, data, fn ) {
    var handler;

    // B
    // Handle object literals
    if ( typeof type === "object" ) {
      for ( var key in type ) {
        this[ name ](key, data, type[key], fn);
      }
      return this;
    }

    // C
    if ( arguments.length === 2 || data === false ) {
      fn = data;
      data = undefined;
    }

    // D
    if ( name === "one" ) {
      handler = function( event ) {
        jQuery( this ).unbind( event, handler );
        return fn.apply( this, arguments );
      };
      handler.guid = fn.guid || jQuery.guid++;
    } else {
      handler = fn;
    }

    // E
    if ( type === "unload" &amp;&amp; name !== "one" ) {
      this.one( type, data, fn );

    // F
    } else {
      for ( var i = 0, l = this.length; i &lt; l; i++ ) {
        jQuery.event.add( this[i], type, handler, data );
      }
    }

    return this;
  };
});
{% endhighlight %}

なお、A~Eは私が付けました。 A の".fn"はjQueryでは".prototype"のはず。そうしてみると、Dの部分以外はoneとbindで共通なんですね。 また、Bを見て、初めて複数登録ができる事を知りました。

Cは第2引数が無いときの処理。特に変わった点はありませんが、個人的には「JavaScriptで多重定義ってこうやれば簡潔なんだ」という良い見本になりました。

Dでは、one/bindどちらの場合も関数の参照をhandlerプロパティに代入するようですが、oneの場合は一度無名関数を作り、関数の冒頭でいきなり自分自身をunbindします。これで1回限りであることを保障するわけですね。その後引数を与えて実行します。

Eは、unload時は登録を一回限りにしようという分岐です。破棄するんだから自ずと1回限りじゃないかと思うんですが、こうしないとブラウザによってはメモリが開放されなかったりするんでしょうか。

最後にFでaddメソッドにほぼ全て丸投げしています。ということで、addメソッドも見てみましょう。長いので適宜省略しています。

{% highlight javascript %}
// line 2511-
jQuery.event = {

  // Bind an event to an element
  // Original by Dean Edwards
  add: function( elem, types, handler, data ) {

    ...

    var handleObjIn, handleObj;

    if ( handler.handler ) {
      handleObjIn = handler;
      handler = handleObjIn.handler;
    }
{% endhighlight %}

この部分はちょっと分かりません。handlerが重層構造になる状況というのはどういう場合でしょうか。handlerが参照する関数内でさらにbindなどをすると重層構造になるんですかね。その場合、このロジックだと1層目の関数をスキップしてしまいそうですが、いいんでしょうか。

{% highlight javascript %}
    // Make sure that the function being executed has a unique ID
    if ( !handler.guid ) {
      handler.guid = jQuery.guid++;
    }
{% endhighlight %}

ここで再度guidが出てきますね。結局、oneでもbindでもユニークIDを割り振るようです。

{% highlight javascript %}
    // Init the element's event structure
    var elemData = jQuery._data( elem );

    // If no elemData is found then we must be trying to bind to one of the
    // banned noData elements
    if ( !elemData ) {
      return;
    }
{% endhighlight %}

_dataはjQuery.dataと同じでした。つまり、elem = thisで示されるあるjQueryオブジェクトに関連付けられたデータを、ここで引き出すようです。そして、この後明らかになりますが、このデータ内にハンドラとかIDとかを詰め込んでいる様子です。これらのデータ/プロパティは、あるものについては$()セレクタで呼び出したときに自動的に付加され、その他はこの下で行われるように、参照を通じて納められるのではないでしょうか。

{% highlight javascript %}
    var events = elemData.events,
      eventHandle = elemData.handle;

    if ( !events ) {
      elemData.events = events = {};
    }

    if ( !eventHandle ) {
      elemData.handle = eventHandle = function( e ) {
        // Discard the second event of a jQuery.event.trigger() and
        // when an event is called after a page has unloaded
        return typeof jQuery !== "undefined" &amp;&amp; (!e || jQuery.event.triggered !== e.type) ?
          jQuery.event.handle.apply( eventHandle.elem, arguments ) :
          undefined;
      };
    }
{% endhighlight %}

ここでeventHandleに仮引数のhandleを入れてますね。eventHandleは、この後addEventListenerに直接渡される変数です。

{% highlight javascript %}
    // Add elem as a property of the handle function
    // This is to prevent a memory leak with non-native events in IE.
    eventHandle.elem = elem;

    // Handle multiple events separated by a space
    // jQuery(...).bind("mouseover mouseout", fn);
    types = types.split(" ");

    var type, i = 0, namespaces;

    while ( (type = types[ i++ ]) ) {
      handleObj = handleObjIn ?
        jQuery.extend({}, handleObjIn) :
        { handler: handler, data: data };
{% endhighlight %}

ここでhandleObjにbindの第2引数で指定するdataを入れてます。.extendはいわゆるディープコピーのはず。最後の最後にこのhandleObjが登場し、handlersという（恐らく）個々のjQueryオブジェクトに関連付けられる何かへの参照を保持する配列にpushされますから、これはaddメソッド内部のみで一時的な変更を加えて使うためコピーですね。

{% highlight javascript %}
      ...
      // Get the current list of functions bound to this event
      var handlers = events[ type ],
        special = jQuery.event.special[ type ] || {};
{% endhighlight %}

そのhandlersです。unbindの際に重要になりますが、イベントの種類ごとに分かれているようです。ここで整理すると、bind/one内のthis = elem、elemに関連付けられたオブジェクト = elemData、events / eventHandle = elemData内のプロパティです。elemDataは、上で見たように、_dataメソッドでDOMオブジェクトに関連付けられています。

{% highlight javascript %}
      // Init the event handler queue
      if ( !handlers ) {
        handlers = events[ type ] = [];

        // Check for a special event handler
        // Only use addEventListener/attachEvent if the special
        // events handler returns false
        if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
          // Bind the global event handler to the element
          if ( elem.addEventListener ) {
            elem.addEventListener( type, eventHandle, false );

          } else if ( elem.attachEvent ) {
            elem.attachEvent( "on" + type, eventHandle );
          }
        }
      }
{% endhighlight %}

やっとaddEventListenerが出てきます。eventHandleは少し上で出てきました。elemData.handleを指しています。

{% highlight javascript %}
      ...
      // Add the function to the element's handler list
      handlers.push( handleObj );
{% endhighlight %}

ここで、handleObjをhandleObjに入れています。やはり最後は配列なんですね。handlersはeventsを、eventsはelemDataを参照しており、elemDataは個々のjQueryオブジェクト内のプロパティを参照しているのだと思われます。で、その中に、今回登録したhandleがあるわけです。

{% highlight javascript %}
      // Keep track of which events have been used, for event optimization
      jQuery.event.global[ type ] = true;
    }

    // Nullify elem to prevent memory leaks in IE
    elem = null;
  },
{% endhighlight %}

うーん、大変ややこしいですね。でもまあ、大体の構造は分かりました。「個々のjQueryオブジェクトは、自分に関連付けられるイベントの情報を自前で保存している」という点が重要だと思います。 次はunbindメソッドです。
unbindの仕組み

{% highlight javascript %}
unbind: function( type, fn ) {
  // Handle object literals
  if ( typeof type === "object" &amp;&amp; !type.preventDefault ) {
    for ( var key in type ) {
      this.unbind(key, type[key]);
    }

  } else {
    for ( var i = 0, l = this.length; i &lt; l; i++ ) {
      jQuery.event.remove( this[i], type, fn );
    }
  }

  return this;
},
{% endhighlight %}

unbindもbindと基本構造は同じですね。さて、unbindが呼び出すremoveですが、bind以上に長いので、重要部分のみを抜粋します。

{% highlight javascript %}
// line 2640 
// Detach an event or set of events from an element
remove: function( elem, types, handler, pos ) {

  var ret, type, fn, j, i = 0, all, namespaces, namespace, special, eventType, handleObj, origType,
    elemData = jQuery.hasData( elem ) &amp;&amp; jQuery._data( elem ),
    events = elemData &amp;&amp; elemData.events;

    ...

    eventType = events[ type ];

    if ( !eventType ) {
      continue;
    }

    if ( !handler ) {
      for ( j = 0; j &lt; eventType.length; j++ ) {
        handleObj = eventType[ j ];

        if ( all || namespace.test( handleObj.namespace ) ) {
          jQuery.event.remove( elem, origType, handleObj.handler, j );
          eventType.splice( j--, 1 );
        }
      }

      continue;
    }
{% endhighlight %}

addではhandlersがevents[ type ]を参照していましたから、removeでも同じだと考えると、eventType[ j ]とadd内のhandlerが対応すると考えてよさそうです。handlerが指定されていないで呼び出された場合、こうやってイベント登録の全消去を行うわけですね。 この後、removeEventというIE対策のラッパー関数を介してremoveEventListenerが呼び出されます。
まとめ

+ jQueryでは、DOMオブジェクト毎に配列の形でハンドラを保管している。
+ oneはややこしいことはしていない。単に無名関数でくるんで、まっさきにイベント登録を消した上で目的の関数を実行するだけ。
+ unbindは保管したハンドラを利用して、イベント登録全消去機能を実現している。