# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 7

from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = { 'themeBar' : "//*[@id='schemeToggle']/span/mat-icon"
         }
theme_name = { 'theme1' : 'iX Blue',
               'theme2' : 'Solarized Dark',
               'theme3' : 'Dark Purple',
               'theme4' : 'Indigo',
               'theme5' : 'Sharks',
               'theme6' : 'Solarized Dark',
               'theme7' : 'Dark Purple',
               'theme8' : 'iX Blue'
              }



class change_theme_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_theme1(self):
        self.theme_change(theme_name['theme1'])

    def test_02_theme2(self):
        self.theme_change(theme_name['theme2'])

    def test_03_theme3(self):
        self.theme_change(theme_name['theme3'])

    def test_04_theme4(self):
        self.theme_change(theme_name['theme4'])

    def test_05_theme5(self):
        self.theme_change(theme_name['theme5'])

    def test_06_theme6(self):
        self.theme_change(theme_name['theme6'])

    def test_07_theme7(self):
        self.theme_change(theme_name['theme7'])

    def test_08_theme8(self):
        self.theme_change(theme_name['theme8'])


    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def theme_change(self, which):
        # Click on the theme Button
        driver.find_element_by_xpath(xpaths['themeBar']).click()
        time.sleep(1)
        print ("selecting theme: " + which)
        if (self.is_element_present(By.XPATH, "//*[contains(text(), \'" + which + "\'  )]")):
            print ("attempting to click on theme: " + which)
            driver.find_element_by_xpath("//*[contains(text(), \'" + which + "\'  )]").click()
            time.sleep(2)
        else:
            print (" Theme not present so making theme default ixblue")
            driver.find_element_by_xpath("//*[contains(text(), 'iX Blue')]").click()
            time.sleep(2)

    def screenshot(self, count):
        time.sleep(1)
        text_path = os.path.dirname(os.path.realpath(__file__))
        filename = str(__file__)
        filename = filename[:-3]
        final_file = filename.replace(text_path + "/", '')
        print ("Taking screenshot for " + final_file + " Test no:" count)
        driver.save_screenshot(cwd + "/screenshot/"  + "screenshot-" + final_file + "-" + count + ".png")

    @classmethod
    def tearDownClass(inst):
        pass

def run_change_theme_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(change_theme_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
