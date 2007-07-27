require 'rake'
require 'fileutils'

SOURCE_DIR = 'src'
PACKAGE_DIR = 'lib'
PACKAGES = {
  'sylvester'   => %w(base geometry)
}

task :build => [:create_directory, :destroy] do
  PACKAGES.each do |name, files|
    code = ''
    files.each do |source_file|
      File.open("#{SOURCE_DIR}/#{source_file}.src.js", 'r') do |f|
        f.each_line do |line|
          unless (src = line.gsub(/\/\/.*$/, '')) =~ /^\s*$/
            code << src.gsub(/\n/, '').strip
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
