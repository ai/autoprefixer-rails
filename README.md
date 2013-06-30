# Autoprefixer Rails

Parse CSS and add vendor prefixes to CSS rules using values
from the [Can I Use](http://caniuse.com/) website.

This gem provides Ruby and Ruby on Rails integration with the
[Autoprefixer](https://github.com/ai/autoprefixer) JavaScript library.

Write your CSS rules without vendor prefixes (in fact, forget about them
entirely) and Autoprefixer will apply vendor prefixes for you.

For example in `app/assets/stylesheet/foobar.sass`:

```sass
a
  transition: transform 1s
```

Autoprefixer uses a database with current browser statistics
and properties support to add vendor-prefixes automatically using the
Asset Pipeline:

```css
a {
  -webkit-transition: -webkit-transform 1s;
  -o-transition: -o-transform 1s;
  transition: -ms-transform 1s;
  transition: transform 1s
}
```

You can use it with CSS, SCSS, Sass, LESS or Stylus, because the Assets Pipeline
has a nice architecture for cascade filters.

Sponsored by [Evil Martians](http://evilmartians.com/).

## Features

* Works with CSS, SaSS, Stylus or preprocessor, which is supported
  in Assets Pipeline.
* You write normal properties (not special mixins), so you don’t need
  to remember which properties needs to be prefixed.
* Autoprefixer uses only necessary prefixes. You choose which browsers
  (by default the last 2 versions for each browser).
  Did you know, that prefixes for `border-radius`
  [have not been necessary](http://caniuse.com/border-radius)
  for a long time now?
* The properties and browsers database is updated automatically
  (from [Can I Use](http://caniuse.com/)), so prefixes will always be up-to-date
  (scripts don’t have holidays or work).
* Removes outdated prefixes to clean libraries and legacy code.
* Adds prefixes to values. For example, to `calc(1em + 5px)` or to property
  names in `transition`.

## Usage

### Ruby on Rails

Add the `autoprefixer-rails` gem to your `Gemfile` and write your CSS rules
without even thinking about prefixes. Autoprefixer will automatically add
the necessary vendor prefixes for you.

```ruby
gem "autoprefixer-rails"
```

If you need to specify browsers for your project (by default, it’s last
2 versions of each browser, like
[Google](http://support.google.com/a/bin/answer.py?answer=33864)),
you can [save them](https://github.com/ai/autoprefixer#browsers)
to `config/autoprefixer.yml`:

```yaml
browsers:
  - "last 1 version"
  - "> 1%"
  - "ie 8"
```

Autoprefixer will process only your CSS from `app/` and `lib/` directories.

You can inspect what properties will be changed using a Rake task:

```sh
rake autoprefixer:inspect
```

### Sprockets

If you use Sinatra or other non-Rails frameworks with Sprockets,
just connect your Sprockets environment to Autoprefixer and write CSS
in the usual way:

```ruby
assets = Sprockets::Environment.new do |env|
  # Your assets settings
end

require "autoprefixer-rails"
AutoprefixerRails.install(assets)
```

You can specify arrays of browsers as a second argument to the `install` method.

### Ruby

If you need to call Autoprefixer from plain Ruby code, it’s very easy:

```ruby
require "autoprefixer-rails"
prefxied = AutoprefixerRails.compile(css)
```

You can specify arrays of browsers as a second argument to the `compile` method.
