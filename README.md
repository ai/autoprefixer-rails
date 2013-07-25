﻿# Autoprefixer Rails

[Autoprefixer](https://github.com/ai/autoprefixer) is a tool
to parse CSS and add vendor prefixes to CSS rules using values
from the [Can I Use](http://caniuse.com/). This gem provides
Ruby and Ruby on Rails integration with this JavaScript tool.

Sponsored by [Evil Martians](http://evilmartians.com/).

## Usage

### Ruby on Rails

Add the `autoprefixer-rails` gem to your `Gemfile`:

```ruby
gem "autoprefixer-rails"
```

Write your CSS (Sass, Stylus, LESS) rules without vendor prefixes
and Autoprefixer will apply prefixes for you.
For example in `app/assets/stylesheet/foobar.sass`:

```sass
a
  transition: transform 1s
```

Autoprefixer uses Can I Use database with browser statistics and properties
support to add vendor prefixes automatically using the Asset Pipeline:

```css
a {
  -webkit-transition: -webkit-transform 1s;
  -o-transition: -o-transform 1s;
  transition: -ms-transform 1s;
  transition: transform 1s
}
```

If you need to specify browsers for your project (by default, it’s
last 2 versions of each browser, [like Google]), you can save them
to `config/autoprefixer.yml`. See [browser section] in Autoprefixer docs.

```yaml
browsers:
  - "last 1 version"
  - "> 1%"
  - "ie 8"
```

You can inspect what properties will be changed using a Rake task:

```sh
rake autoprefixer:inspect
```

[like Google]:     http://support.google.com/a/bin/answer.py?answer=33864
[browser section]: https://github.com/ai/autoprefixer#browsers

### Sprockets

If you use Sinatra or other non-Rails frameworks with Sprockets,
just connect your Sprockets environment to Autoprefixer and write CSS
in the usual way:

```ruby
assets = Sprockets::Environment.new do |env|
  # Your assets settings
end

require "autoprefixer-rails"
AutoprefixerRails.install(assets)
```

### Ruby

If you need to call Autoprefixer from plain Ruby code, it’s very easy:

```ruby
require "autoprefixer-rails"
prefixed = AutoprefixerRails.compile(css)
```
