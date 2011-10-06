---
layout: post
title: "CentOS 6 64bitで、Ruby 1.9.2 + eclipse 3.7 + MySQL 5.5の開発環境を整える。"
---

想定するのは、CentOS 6.0 64bitを"Minimal Desktop"でインストールした環境。ただ32bitでも、インストールにおいては恐らくディレクトリ名が変わるだけだし、我々がそれに干渉することはないので、以下を同様に実行してもたぶん問題ないでしょう。各ライブラリのバージョン等は執筆時点のものなので、適宜変更して下さい。

#Rubyを入れる。
CentOSを入れ終わり、ネットに接続し、rootでログインしている事を前提とする。

まずRubyを入れるが、yumで入れるとバージョンが1.8.7なので、1.9.2のソースを入手して自分でコンパイルする。ただし、その前にやることがある。

Rubyにはirbという使い勝手のいいインタプリタツールが付属しているが、readlineというライブラリを先に入れてからmakeしないとirbの入力履歴機能などが使えず大変不便。そこで、先にそれを入れる。また、Minimal Desktopではgcc等が入っていないので、それも入れる。

{% highlight bash %}
yum -y install readline-devel gcc
{% endhighlight %}

それが終わったら、

{% highlight bash %}
wget ftp://ftp.ruby-lang.org/pub/ruby/1.9/ruby-1.9.2-p290.tar.gz
tar xvzf ruby-1.9.2-p290.tar.gz
cd ruby-1.9.2-p290
./configure
make
make install
{% endhighlight %}

このようにすればいい。

なお、Rubyのソース内にはこの後で使うスクリプトがあるので、インストールが終わっても消さずにとっておく。

#RubyGemsを入れる

yumだとバージョンがやっぱり古いので、これもソースから入れる。

{% highlight bash %}
wget http://rubyforge.org/frs/download.php/75255/rubygems-1.8.8.tgz
tar xvzf rubygems-1.8.8.tgz
cd rubygems-1.8.8
ruby setup.rb
{% endhighlight %}

これで終わり。ただし、このままではgem実行時に

{% highlight bash %}
$ gem install mysql
ERROR:  Loading command: install (LoadError)
    no such file to load -- zlib
ERROR:  While executing gem ... (NameError)
    uninitialized constant Gem::Commands::InstallCommand
{% endhighlight %}

という「zlibが足りない」エラーが出るはず。それを回避するため、zlib-develをyumで入れた後、先ほど解凍したRubyソースディレクトリ内の、/ext/zlib/extconf.rbを実行する。

{% highlight bash %}
yum install -y zlib-devel
cd Rubyソースのディレクトリ/ext/zlib
ruby extconf.rb
make
make install
{% endhighlight %}

ちなみに、zlib-develをインストールせずにruby extconf.rbとした場合には、次のようなエラーが出るはず。

{% highlight bash %}
$ ruby extconf.rb
checking for deflateReset() in -lz... no
checking for deflateReset() in -llibz... no
checking for deflateReset() in -lzlib1... no
checking for deflateReset() in -lzlib... no
checking for deflateReset() in -lzdll... no
{% endhighlight %}

なお、Rubyのソースはこの後さらに使う機会があるので、まだ消してはいけない。

#MySQLを入れる

こちらを参考にした。

rpmでもソースコンパイルでも構わないが、"Minimal Desktop"構成だとすでにMySQL 5.1が入っており、へたに後入れして関連ライブラリごとのバージョン相違などを起こしたくないので、できるだけyumでやりたい。

ただ当然ながら、保守派のCentOSさんのデフォルトレポジトリには5.5が入っていない。そこで、5.5が存在するremiレポジトリを使えるようにする ((CentOS "6"かつ64bit用のレポジトリをダウンロードしている事に注意。)) 。


{% highlight bash %}
# remiレポジトリを有効にする。epelはremiが依存するパッケージなので、これも必要。
rpm -ivh http://download.fedora.redhat.com/pub/ \
 epel/6/x86_64/epel-release-6-5.noarch.rpm
rpm -ivh http://remi-mirror.dedipower.com/enterprise/remi-release-6.rpm
{% endhighlight %}

その後、

{% highlight bash %}
yum --enablerepo=remi -y install mysql \
 mysql-devel mysql-server
{% endhighlight %}

とする。

#MySQL/Rubyを入れる

MySQL/Rubyとは、とみたまさひろ氏の作ったRuby用MySQL API。実はRuby/MySQLというRubyのみで書かれたライブラリもあり、作者はそちらの使用を薦めているのだが、今回はMySQL/Rubyを入れる。それには、単に

{% highlight bash %}
gem install mysql
{% endhighlight %}

とすればよい。ただし、私と全く同じ環境でやればエラーは出ないと思うが、場合によっては次のようなエラーが出るかもしれない（以前経験したが、どういう環境だったかは忘れた。ソースからMySQLを入れた後、適切な設定をしないままだとこうなるんじゃなかったか）。

{% highlight bash %}
$ gem install mysql
Building native extensions.  This could take a while...
ERROR:  Error installing mysql:
  ERROR: Failed to build gem native extension.

/usr/local/bin/ruby extconf.rb install mysql
checking for mysql_query() in -lmysqlclient... no
checking for main() in -lm... yes
checking for mysql_query() in -lmysqlclient... no
checking for main() in -lz... yes
checking for mysql_query() in -lmysqlclient... no
checking for main() in -lsocket... no
checking for mysql_query() in -lmysqlclient... no
checking for main() in -lnsl... yes
checking for mysql_query() in -lmysqlclient... no
*** extconf.rb failed ***
Could not create Makefile due to some reason, probably lack of
necessary libraries and/or headers.  Check the mkmf.log file for more
details.  You may need configuration options.
{% endhighlight %}

どうやら、mysqlのメソッドの存在を認識できていない様子。ならばmysqlの設定の存在を教えてあげればいい。具体的には、

{% highlight bash %}
gem install mysql -- --with-mysql-config
# もしくは
gem install mysql -- --with-mysql-config=(パス)/mysql_config
{% endhighlight %}

とする。mysql_configのパスは、

{% highlight bash %}
find / -name mysql_config
{% endhighlight %}

とでもして探せばいいんじゃないかと思う。たぶん/usr/binと/usr/lib64にある（32bitなら/usr/libだろう） 。

#Eclipseを入れる

ブラウザからダウンロードしてもいいし、適当なミラーを探した上で、
wget http://www.ring.gr.jp/pub/misc/eclipse/downloads/drops/R-3.7-201106131736/eclipse-SDK-3.7-linux-gtk-x86_64.tar.gz
などとしてもいい。その後は、こちらに書いてある通りやればいい。ここでは省略したが、最後のまとめに全処理を書いておいた。

#Aptana Pluginを入れる
http://www.aptana.com/products/studio3/download

ここへ行き、Eclipse Plug-in Versionにチェックした上で、下のDownloadボタンを押す。
http://download.aptana.com/studio3/plugin/install
すると、↑が表示されるはずなので、これをコピーし、

- EclipseのHelp -&gt; Install New Software 冒頭の"Work with"のテキストボックスにペースト
- 下のボックスに"Aptana Studio 3"が現れるので、チェックをして右下のインストールボタンを押し、支持に従う

で、めでたくAptanaプラグインが導入され、Ruby固有の処理が可能になる。


#ruby-debugを入れる
これを入れないと、Eclipseのデバッガが有効にならない。入れていない場合、Eclipseのデバッグ開始時に次のようなメッセージが出ると思う。

{% highlight bash %}
Unable to find 'rdebug-ide' binary script. May need to install 'ruby-debug-ide' gem, or may need to add your gem executable directory to your PATH (check location via 'gem environment').
{% endhighlight %}

つまり、ruby-debug-ideを入れなければならない。しかし、単純に gem install ruby-debug-ideとすると、

{% highlight bash %}
$ gem install ruby-debug-ide
Building native extensions.  This could take a while...
ERROR:  Error installing ruby-debug-ide:
  ERROR: Failed to build gem native extension.

        /usr/local/bin/ruby mkrf_conf.rb
Building native extensions.  This could take a while...

Gem files will remain installed in 
/usr/local/lib/ruby/gems/1.9.1/gems/ruby-debug-ide-0.4.16 for inspection.
Results logged to 
/usr/local/lib/ruby/gems/1.9.1/gems/ruby-debug-ide-0.4.16/ext/gem_make.out
{% endhighlight %}

このようになると思う。ruby-debug-ideはruby-debug-baseという別のライブラリに依存しているので、そちらを先に入れなければならない。

しかし、gem install ruby-debug-baseとすると、これもまた簡単にいかない。

{% highlight bash %}
$ gem install ruby-debug-base
ERROR:  Error installing ruby-debug-base:
  rbx-require-relative requires Ruby version ~&gt; 1.8.7.
{% endhighlight %}

1.8.7なんか使ってないのに…。調べてみると、どうやら1.9.2用のruby-debug19というものがあり、これがruby-debug-baseに値するらしい。したがって、それを先に入れる。

…えっさすがに今度はうまく行くよね？　いやいや上手くいきません。頭の痛いことに、これもそのままではインストールできない。

{% highlight bash %}
$ gem install ruby-debug19
Building native extensions.  This could take a while...
ERROR:  Error installing ruby-debug19:
  ERROR: Failed to build gem native extension.

        /usr/local/rvm/rubies/ruby-1.9.2-p290/bin/ruby extconf.rb
*** extconf.rb failed ***

...
/usr/local/rvm/rubies/ruby-1.9.2-p290/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require': no such file to load -- openssl (LoadError)

...

Gem files will remain installed in /usr/local/rvm/gems/ruby-1.9.2-p290/gems/linecache19-0.5.12 for inspection.
Results logged to /usr/local/rvm/gems/ruby-1.9.2-p290/gems/linecache19-0.5.12/ext/trace_nums/gem_make.out
{% endhighlight %}


長いので何が問題かが分かりづらいが、中盤に「opensslが見つからない」とある。ただし、ここで yum install openssl openssl-develとかやっても効果がない（というよりも、yumでMySQL5.5を入れたなら、両者とも依存ライブラリとしてすでにインストールされているはず)。

そこで再度、消さずに取っておいたRubyのソースが活躍する。zlibのときと同様にソース付属のスクリプトを使い、次のように実行する。

{% highlight bash %}
cd rubyのディレクトリ/ext/openssl
ruby extconf.rb
make
make install
{% endhighlight %}

そうすると、やっと

{% highlight bash %}
gem install ruby-debug19
gem install ruby-debug-ide
{% endhighlight %}

が通るようになる。ここでgem listを確認してみると、

{% highlight bash %}
gem list
archive-tar-minitar (0.5.2)
columnize (0.3.4)
linecache19 (0.5.12)
rake (0.9.2 ruby)
ruby-debug-base19 (0.11.25)
ruby-debug-ide (0.4.16)
ruby-debug19 (0.11.6)
ruby_core_source (0.1.5)
{% endhighlight %}

このようにbaseもideも入ってると思う。そして、Eclipseのデバッグも有効に機能するはず。

#結局何をやればいいのか

以下を上から実行すればいいと思います。ただし上述のように、適宜バージョン等を変えて。

{% highlight bash %}
Ruby
# irbの履歴機能を有効にするための準備
yum -y install readline-devel

# まだ入れていなければ、Cコンパイラのインストール
yum -y install gcc

# rubyのインストール
wget ftp://ftp.ruby-lang.org/pub/ruby/1.9/ruby-1.9.2-p290.tar.gz
tar xvzf ruby-1.9.2-p290.tar.gz
cd ./ruby-1.9.2-p290
./configure
make
make install
RubyGems
# RubyGemsのインストール
wget http://rubyforge.org/frs/download.php/75255/rubygems-1.8.8.tgz
tar xvzf rubygems-1.8.8.tgz
cd rubygems-1.8.8
ruby setup.rb

# zlibのインストール
yum install -y zlib-devel
cd ./ruby-1.9.2-p290/ext/zlib
ruby extconf.rb
make
make instal
MySQLとMySQL/Ruby
# remiレポジトリを有効にする。epelはremiが依存するパッケージなので、これも必要。
rpm -ivh http://download.fedora.redhat.com/pub/ \
 epel/6/x86_64/epel-release-6-5.noarch.rpm
rpm -ivh http://remi-mirror.dedipower.com/enterprise/remi-release-6.rpm

# MySQL5.5のインストール
yum --enablerepo=remi,epel install mysql mysql-devel

# MySQL/Rubyのインストール
# 問題が出た場合は、記事を参照
gem install mysql
Eclipse

# eclipseのインストール
wget http://www.ring.gr.jp/pub/misc/eclipse/ \
 downloads/drops/R-3.7-201106131736/eclipse-SDK-3.7-linux-gtk-x86_64.tar.gz
tar -xvzf eclipse-SDK-3.7-linux-gtk-x86_64.tar.gz -C /opt

# 読み取りのパーミッションを付与し、/usr/binとのパスを繋げる。
# 以下、/optは適宜変更する。
chmod -R +r /opt/eclipse
touch /usr/bin/eclipse
chmod 755 /usr/bin/eclipse

#　以下の内容のファイルを、
# /usr/bin/eclipseという名前で作る（この行の下から）。
#!/bin/sh
export ECLIPSE_HOME="/opt/eclipse"

$ECLIPSE_HOME/eclipse $*

## Create following file, with our favourite editor ##
/usr/share/applications/eclipse.desktop

# 以下の内容のファイルを、
# /usr/share/applications/eclipse.desktopという名前で作る。
[Desktop Entry]
Encoding=UTF-8
Name=Eclipse
Comment=Eclipse SDK 3.7
Exec=eclipse
Icon=/opt/eclipse/icon.xpm
Terminal=false
Type=Application
Categories=GNOME;Application;Development;
StartupNotify=true
Aptana Plugin
# EclipseのHelp -&gt; Install New Software
# 冒頭の"Work with"のテキストボックスにペースト
# 下のボックスに"Aptana Studio 3"が現れるので、チェックをして右下のインストールボタンを押し、支持に従う
ruby-debug

# opensslのインストール
cd ./ruby-1.9.2-p290/ext/openssl
ruby extconf.rb
make
make install

# ruby-debugのインストール
gem install ruby-debug19
gem install ruby-debug-ide
{% endhighlight %}