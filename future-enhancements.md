# Arabic Maqamat roadmap

This roadmap reflects the current implementation. Shared workspace persistence, the audio transport controller, accessible shell tabs, bilingual font styling, and MusicXML viewing/download are already present. The work below focuses on completing and hardening those foundations.

## Content & Educational Enhancements

Add a dedicated "Maqam Facts" educational section
The facts.md contains excellent educational content about maqam theory that could be integrated as a learning module
Consider adding a tooltip or modal system that shows the core concepts (root jins, ghammaz, sayr) when users interact with maqam elements

Enhanced Sayr visualization
The facts.md emphasizes sayr (melodic course) as crucial to maqam identity
Current UI shows sayr direction but could visually represent the melodic trajectory (ascending, descending_octave_first, undulating)
Could add animated path indicators or interactive sayr diagrams

Family taxonomy improvements
The "صُنِعَ بِسِحْرِك" mnemonic is already in the UI, but could be more prominently featured
Consider adding color-coding or visual grouping by family across all views
Could add a "Family Explorer" that shows all maqamat within each family with their relationships

UI/UX Enhancements
Interactive ajnas visualization
The facts.md emphasizes that maqam identity comes from the relationship between root jins, upper jins, ghammaz, and sayr
Could add an interactive diagram showing how ajnas connect and overlap for each maqam
Visual representation of Ittisal vs Infisal vs Tadakhul connections
Ghammaz emphasis
The ghammaz is described as "the most important secondary emphasis"
Currently shown but could be more visually prominent in the scale display
Could add audio emphasis when playing the ghammaz note

Technical Enhancements
Description localization
The facts.md content is in English, but the app supports Arabic
Could add Arabic translations of the updated descriptions for better bilingual support
Transposition context
The facts.md mentions specific transpositions (like Farahfaza as transposition of Nahawand)
Could enhance the transposition UI to show these relationships more clearly
Add visual indicators when a maqam is a transposition of another