"""Renumber DTP-086..DTP-111 to PWF-001..PWF-026.

Run inside the ProjectWorkflow folder:  py D:\\Projects\\renumber_pwf.py

Changes commit messages, file names and file text. Every other DTP number
(DTP-001..DTP-085, DTP-112 and up) is left exactly as it is.
Mapping: PWF number = DTP number - 85  (DTP-086 -> PWF-001, DTP-111 -> PWF-026).
"""
import re
import git_filter_repo as fr

# Exactly DTP-086..DTP-111, not followed by another digit. Any letter case.
PATTERN = re.compile(rb'(dtp)-(08[6-9]|09[0-9]|10[0-9]|11[01])(?![0-9])', re.IGNORECASE)


def _swap(m):
    prefix = b'pwf' if m.group(1).islower() else b'PWF'
    return prefix + b'-%03d' % (int(m.group(2)) - 85)


def renumber(data):
    return PATTERN.sub(_swap, data)


def message_callback(message):
    return renumber(message)


def filename_callback(filename):
    return renumber(filename)


def blob_callback(blob, metadata):
    blob.data = renumber(blob.data)


# --force: this folder is a throwaway copy that has already been filtered once.
args = fr.FilteringOptions.parse_args(['--force'])
fr.RepoFilter(args,
              message_callback=message_callback,
              filename_callback=filename_callback,
              blob_callback=blob_callback).run()
