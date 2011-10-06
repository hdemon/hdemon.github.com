---
layout: post
style: text
title: "CentOS 6 64bitで、Ruby 1.9.2 + eclipse 3.7 + MySQL 5.5の開発環境を整える。"
---

想定するのは、CentOS 6.0 64bitを"Minimal Desktop"でインストールした環境。ただ32bitでも、インストールにおいては恐らくディレクトリ名が変わるだけだし、我々がそれに干渉することはないので、以下を同様に実行してもたぶん問題ないでしょう。各ライブラリのバージョン等は執筆時点のものなので、適宜変更して下さい。

#Rubyを入れる。
CentOSを入れ終わり、ネットに接続し、rootでログインしている事を前提とする。

まずRubyを入れるが、yumで入れるとバージョンが1.8.7なので、1.9.2のソースを入手して自分でコンパイルする。ただし、その前にやることがある。

Rubyにはirbという使い勝手のいいインタプリタツールが付属しているが、readlineというライブラリを先に入れてからmakeしないとirbの入力履歴機能などが使えず大変不便。そこで、先にそれを入れる。また、Minimal Desktopではgcc等が入っていないので、それも入れる。

{% highlight ruby %}
yum -y install readline-devel gcc
{% endhighlight %}
