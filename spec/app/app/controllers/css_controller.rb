class CssController < ApplicationController
  def test
    render text: Rails.application.assets['test.css']
  end
end
