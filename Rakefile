require 'rake'
require 'fileutils'
require 'find'

SOURCE_DIR = 'src'
PACKAGE_DIR = 'lib'
PACKAGES = {
  'sylvester'   => %w(vector matrix line line.segment plane polygon polygon.vertex linkedlist)
}

task :default => :build

task :build => [:create_directory, :destroy] do
  PACKAGES.each do |name, files|
    code = ''
    files.each do |source_file|
      File.open("#{SOURCE_DIR}/#{source_file}.js", 'r') do |f|
        f.each_line do |line|
          unless (src = line.gsub(/\/\/.*$/, '')) =~ /^\s*$/
            code << src.gsub(/\n/, '').gsub(/\s+/, ' ').strip
          end
        end
      end
    end
    File.open("#{PACKAGE_DIR}/#{name}.js", 'wb') { |f| f.write code }
  end
end

task :create_directory do
  FileUtils.mkdir_p(PACKAGE_DIR) unless File.directory?(PACKAGE_DIR)
end

task :destroy do
  PACKAGES.each do |name, files|
    file = "#{PACKAGE_DIR}/#{name}.js"
    File.delete(file) if File.file?(file)
  end
end

desc "Searches all project files and lists those whose contents match the regexp"
task :grape do

  # Configuration
  dir = '.'
  excluded_dirs = %w(lib test).collect { |d| dir + '/' + d }
  dir_regexp = Regexp.new('^' + dir.gsub(/\./, '\.'))
  list_numbers = 6
  visible_lines = ENV['v'].to_s.empty? ? 2 : ENV['v'].to_i
  
  # Supported file extensions
  extensions = %w(rb rhtml rxml rjs erb rake yml yaml sql html htm xml js css txt cgi fcgi htaccess)
  ext_match = Regexp.new("\.(#{extensions.join('|')})$", Regexp::IGNORECASE)
  
  # Search setup
  pattern = Regexp.new(ENV['q'].to_s, ENV['cs'] ? nil : Regexp::IGNORECASE)
  verbose = !ENV['v'].nil?
  results, paths = [], []
  
  # Loop through files
  Find.find(dir) do |path|
    next unless File.file?(path) and path.match(ext_match) and !path.match(/\/\.svn\//i)
    skip = false
    excluded_dirs.each { |excl| skip = true if path =~ Regexp.new('^' + excl.gsub(/\./, '\.')) }
    next if skip
    
    lines = []
    File.open(path, 'r') do |f|
      
      file_lines = []
      f.each_line { |line| file_lines << line }
      
      file_lines.each_with_index do |line, i|
        if line =~ pattern
          case verbose
          
            when true   # Capture surrounding lines of code
              line_array = []
              ((i - visible_lines)..(i + visible_lines)).each do |x|
                if x >=0 and x < file_lines.length
                  line_array << {:line => x + 1, :text => file_lines[x]}
                end
              end
              results << {:path => path.gsub(dir_regexp, ''), :source => line_array}
            
            when false  # Just record the line number
              lines << i + 1
          end
        end
      end
    end
    
    unless verbose or lines.empty?
      paths << {:path => path.gsub(dir_regexp, ''), :lines => lines}
    end
    
  end
  
  # Display results
  case verbose
  
    when true
      puts "\n  Found #{results.length} match#{paths.length == 1 ? '' : 'es'} for your search.\n"
      results.sort_by { |r| "#{r[:path]}#{'%05d' % r[:source].first[:line]}" }.each_with_index do |r, i|
        puts "\n  #{'% 2d' % (i + 1)}. #{r[:path]}"
        r[:source].each do |line|
          puts "      #{'% 4d' % line[:line]}.  #{line[:text]}"
        end
      end
    
    when false
      puts "\n  Found #{paths.length} file#{paths.length == 1 ? '' : 's'} matching your search.\n\n"
      paths.sort_by { |p| p[:path] }.each do |p|
        lines = p[:lines][0..(list_numbers - 1)].join(', ')
        lines << "..." if p[:lines][list_numbers]
        puts "    - #{p[:path]} : #{lines}"
      end
  end

end
