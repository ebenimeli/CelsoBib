# Gemfile
source "https://rubygems.org"

# --- Núcleo de Jekyll ---
gem "jekyll", "~> 4.4"
gem "jekyll-sass-converter", "< 3.0"
gem "tzinfo-data", "~> 1.2021"
gem "webrick" # necesario para Ruby >= 3.0 en local

# --- Plugins de Jekyll ---
group :jekyll_plugins do
  gem "jekyll-paginate-v2", "~> 3.0"       # ✅ paginación moderna
  gem "jekyll-sitemap"
  gem "jekyll-relative-links"
  gem "jekyll-last-modified-at"
end

# --- Opcional: solo para Windows ---
gem "wdm", ">= 0.1.0", :platforms => [:mingw, :x64_mingw, :mswin]
