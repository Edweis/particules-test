set -e

PROJECT=particules
USER=edweis
SERVER=lipp.kapochamo.com


echo "\n🚀 Send to server"
rsync -ravzh --filter=':- .gitignore'  . $USER@$SERVER:/home/$USER/Documents/$PROJECT/

echo "\n🏃🏻‍♂️ Restart nginx" 
sudo ln -s /home/$USER/Documents/$PROJECT/nginx.conf /etc/nginx/conf.d/$PROJECT.conf # Make sure the symlink exists
ssh $USER@$SERVER "sudo nginx -t && sudo nginx -s reload"
