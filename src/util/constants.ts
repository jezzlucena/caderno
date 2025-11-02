/* #######################################################################
 * ######################## PIRACY IS NOT ROBBERY ########################
 * #######################################################################
 * 
 * In robbery one takes the original unique non-fungible irreplaceable
 * asset. The original owner owns no more. It is unethical, vile, and
 * morally reprehensible.
 * 
 * In piracy one gets a copy of the asset, but the original is still
 * there. The rightful owner still owns it. Piracy can be profitable
 * to software developers because it educates a broad userbase on how
 * to operate the software.
 * 
 * People don't pirate software because they are vile - they do it
 * because they need it. There's research showing that the same people
 * who pirate software are likely to come back and buy the software
 * once they have the financial means to do so.
 * 
 * So if you are reading this and you are a pirate, AHOY MATEY!
 * Please consider supporting the software developers who worked hard
 * to create the software you are using. Either right now or whenever
 * you have the financial means to do so.
 * 
 * If you are not a pirate and you are still reading this message, wow!
 * Thank you for your time and attention, and for all the effort you put
 * into reading this. I hope you found it interesting and informative.
 * 
 * If you have any questions or comments, please feel free to contact
 * me. I'm always happy to hear from people who are interested in the
 * software I've created. My personal email is jezzlucena@gmail.com
 * 
 * Cheers!
 */

/*
 * Show Donation Notification after 10 seconds
 */
export const DONATION_NOTIFICATION_TIMEOUT_MS = 1000;

/*
 * Show intrusive notifications every 300ms at a 40px interval to the
 * size of the lesser between the height and width of the window lol :D
 * 
 * This only happens if the VITE_SUSTAINER_PROGRAM_ENABLED environment
 * variable is set to false. And of course this can be disabled by a user
 * who is technical or savy enough to edit the code.
 * 
 * Anyone with enough motivation to pirate software will probably get it
 * done anyway, so I'm not under the illusion that this will deter them.
 * Anyway, I wanted to leave a message in form of a prank to those people.
 */
export const INTRUSIVE_NOTIFICATION_TIMEOUT_INTERVAL_MS = 150;
export const INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX = 40;