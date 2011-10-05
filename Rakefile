JEKYLL = "jekyll"
SASS = "sass"
SPRITE = "sprite"
COMPASS = "compass"
JUICER = "juicer"
GIT = "git"

task :default => "make"

task "make" => ["sprites", "compass", "jekyll", "release"]

task "jekyll" do
	sh "#{JEKYLL} --pygments"
end

task "sprites" => "sass/sprites.css" do
  sh "ruby -pe '$_.sub!(/^\.sprites\.index-/, \"@mixin\s\")' sass/sprites.css > sass/sprites.scss"  
end

task "sass/sprites.css" => "images" do
  sh "#{SPRITE}"
end

task "compass" => "sprites" do
	sh "#{COMPASS} compile"
end

task "juicer" => ["sprites", "compass"] do
	sh "#{JUICER} merge stylesheets/"
end

task "commit" do
	sh "#{GIT} add ."
	sh "#{GIT} commit -a -m \"modified\""
end

task "release" => "commit" do
	sh "#{GIT} push origin master"
end

