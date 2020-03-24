FROM ruby:2.7
WORKDIR /var/app
COPY . /var/app
RUN bundle install
CMD bundle exec rake build