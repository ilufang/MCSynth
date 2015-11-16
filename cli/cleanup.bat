@echo off
echo Warning: This will also clean your converted respacks.
echo Close this window if you wish to abort.
pause
(
rmdir /S /Q respacks
rmdir /S /Q temp
del kill.lock
del /Q *.error.log
del /Q *.convert.log
del cmdline.txt
del offset.txt
del consonant.txt
del cutoff.txt
) > nul 2> nul 