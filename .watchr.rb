def notify(title, message, image)
  system "notify-send '#{title}' '#{message}' -i '#{image}' -t 2000"
end

def run_withnotify(*files)
  image_root = File.expand_path("~/.autotest_images")
  puts "Running: #{files.join(' ')}"
  results = `bundle exec rspec -f p -c #{files.join(' ')}`
  output = results.slice(/(\d+)\sexamples?,\s(\d+)\sfailures?/)
  failure = (results.split /\n/)[0].index 'F'
  if failure
    notify "FAIL", "#{output}", "#{image_root}/fail.png"
  else
    notify "Pass", "#{output}", "#{image_root}/pass.png"
  end
end

watch("spec/.*/*_spec\.rb") do |match|
  run_withnotify match[0]
end

watch("app/(.*/.*)\.rb") do |match|
  run_withnotify %{spec/#{match[1]}_spec.rb}
end

watch("app/(.*/.*\.erb)") do |match|
  run_withnotify %{spec/#{match[1]}_spec.rb}
end

watch("config/routes.rb") do |match|
  run_withnotify *Dir["spec/routing/*_spec.rb"]
end