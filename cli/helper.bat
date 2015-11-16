@echo off
set /p cmdline= < cmdline.txt
set /p offset= < offset.txt
set /p consonant= < consonant.txt
set /p cutoff= < cutoff.txt
set resampparam=100 N %offset% 500 %consonant% %cutoff%
echo %cmdline% %resampparam%
%cmdline% %resampparam%
del cmdline.txt
del offset.txt
del cutoff.txt
del consonant.txt
