class CssController < ApplicationController
  def test
    file = params[:file] + '.css'
    render plain: Rails.application.assets[file]
  end
end
