@echo off
echo Do NOT close this window.
echo This workarounds the crash issue of resampler
echo It will close automatically after the soundfont generation is complete.
:kill
if not exist kill.lock exit
tskill resampler 2> nul
tskill WerFault 2> nul
ping localhost -n 2 > nul
goto kill