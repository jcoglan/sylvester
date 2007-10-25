require 'find'

class Grape
  
  DIR = '.'
  EXCLUDED_DIRS = %w(doc log tmp vendor/rails)
  EXTENSIONS = %w(rb rhtml rxml rjs erb rake yml yaml sql html htm xml js css txt cgi fcgi htaccess)
  WINDOW = 2
  
  def initialize(config = {})
    @dir = config[:dir] || DIR
    @dir_regexp = Regexp.new('^' + @dir.gsub(/\./, '\.'))
    @excluded_dirs = (config[:excluded_dirs] || EXCLUDED_DIRS).collect { |d| @dir + '/' + d }
    @extensions = config[:extensions] || EXTENSIONS
    @ext_match = Regexp.new("\.(#{@extensions.join('|')})$", Regexp::IGNORECASE)
  end
  
  def search(q, options = {})
    pattern = Regexp.new(q.to_s, options[:case_sensitive] ? nil : Regexp::IGNORECASE)
    verbose = !!options[:verbose]
    window = (w = options[:window]) ? (w.to_s == '' ? WINDOW : w.to_i) : WINDOW
    
    results, paths = [], []
    
    Find.find(@dir) do |path|
      next unless File.file?(path) and path.match(@ext_match) and !path.match(/\/\.svn\//i)
      next if @excluded_dirs.detect { |excl| !!( path =~ Regexp.new('^' + excl.gsub(/\./, '\.')) ) }
      
      lines = []
      File.open(path, 'r') do |f|
        
        file_lines = []
        f.each_line { |line| file_lines << line }
        
        file_lines.each_with_index do |line, i|
          if line =~ pattern
            case verbose
            
              when true # Capture surrounding lines of code
                line_array = []
                ((i - window)..(i + window)).each do |x|
                  if x >=0 and x < file_lines.length
                    line_array << {:line => x + 1, :text => file_lines[x]}
                  end
                end
                results << {:path => path.gsub(@dir_regexp, ''), :source => line_array}
              
              when false # Just record the line number
                lines << i + 1
            end
          end
        end
      end
      
      unless verbose or lines.empty?
        paths << {:path => path.gsub(@dir_regexp, ''), :lines => lines}
      end
    end
    
    verbose ? results : paths
  end
  
  def print_results(results = [])
    unless results.first
      puts "\n  Found 0 matches for your search"
      return
    end
    
    verbose = !!results.first[:source]
    case verbose
  
    when true
      puts "\n  Found #{results.length} match#{results.length == 1 ? '' : 'es'} for your search.\n"
      results.sort_by { |r| "#{r[:path]}#{'%05d' % r[:source].first[:line]}" }.each_with_index do |r, i|
        puts "\n  #{'% 2d' % (i + 1)}. #{r[:path]}"
        r[:source].each do |line|
          puts "      #{'% 4d' % line[:line]}.  #{line[:text]}"
        end
      end
    
    when false
      puts "\n  Found #{results.length} file#{results.length == 1 ? '' : 's'} matching your search.\n\n"
      results.sort_by { |p| p[:path] }.each do |p|
        lines = p[:lines].join(', ')
        puts "    - #{p[:path]} : #{lines}"
      end
    end
  end
  
end
